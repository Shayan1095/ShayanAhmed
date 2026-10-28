"use server";

import { contactSchema, firstIssue, type ContactState } from "@/lib/contact-schema";

/**
 * Contact form server action. Validation and the honeypot are live now.
 * Rate limiting, saving the Inquiry and the Resend email arrive with the
 * database step; until then it reports that sending is not switched on.
 */
export async function sendInquiry(_prev: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    // A filled honeypot means a bot: pretend success, store nothing.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { status: "ok" };
    const { field, message } = firstIssue(parsed.error);
    return { status: "error", field, message };
  }

  return {
    status: "error",
    message: "Sending is not switched on yet.",
    fix: "The form connects to email in the next build step.",
  };
}
