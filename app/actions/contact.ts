"use server";

import { Resend } from "resend";
import { contactSchema, firstIssue, type ContactInput, type ContactState } from "@/lib/contact-schema";
import { connectDb } from "@/lib/db/connect";
import { InquiryModel } from "@/lib/db/models";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/**
 * Contact form: validate, rate limit (5 per hour per IP), save the Inquiry,
 * then email Shayan through Resend. If the email fails the enquiry is still
 * saved and shows in the admin Inbox, so a lead is never lost.
 */
export async function sendInquiry(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    // A filled honeypot means a bot: pretend success, store nothing.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { status: "ok" };
    const { field, message } = firstIssue(parsed.error);
    return { status: "error", field, message };
  }

  const db = await connectDb().catch(() => null);
  if (!db) {
    return {
      status: "error",
      message: "Sending isn't available right now.",
      fix: "Please try again in a few minutes.",
    };
  }

  const limit = await rateLimit(`contact:${await clientIp()}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return {
      status: "error",
      message: "You've sent a few messages already.",
      fix: `Please wait about ${limit.retryAfterMin} minutes, or reply to my email directly.`,
    };
  }

  const { website, ...data } = parsed.data;
  void website;
  const inquiry = await InquiryModel.create(data);
  const emailed = await notify(data);
  if (emailed) await InquiryModel.updateOne({ _id: inquiry._id }, { $set: { emailed: true } });

  return { status: "ok" };
}

async function notify(d: Omit<ContactInput, "website">): Promise<boolean> {
  const { RESEND_API_KEY: key, CONTACT_TO: to, CONTACT_FROM: from } = process.env;
  if (!key || !to || !from) return false;
  try {
    const lines = [`Name: ${d.name}`, `Email: ${d.email}`];
    if (d.projectType) lines.push(`Project: ${d.projectType}`);
    if (d.budget) lines.push(`Budget: ${d.budget}`);
    lines.push("", d.message);
    const { error } = await new Resend(key).emails.send({
      from,
      to,
      replyTo: d.email,
      subject: `New enquiry from ${d.name}${d.projectType ? ` · ${d.projectType}` : ""}`,
      text: `${lines.join("\n")}\n\nReply to this email to answer ${d.name} directly. It's also in your admin Inbox.`,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[contact] email failed; enquiry saved to the inbox:", err);
    return false;
  }
}
