import "server-only";
import { z } from "zod";
import { contactLimits as L, contactMessages as M, type ContactField } from "./contact-rules";

/** Server-side validation. Messages come from contact-rules so client and server agree. */
export const contactSchema = z.object({
  name: z.string().trim().min(1, M.name).max(L.name, M.nameLong),
  email: z.string().trim().max(L.email, M.email).pipe(z.email(M.email)),
  projectType: z.string().trim().max(L.short).optional().default(""),
  budget: z.string().trim().max(L.short).optional().default(""),
  message: z.string().trim().min(L.messageMin, M.messageShort).max(L.messageMax, M.messageLong),
  /** Honeypot. Real people never fill it. */
  website: z.string().max(0).optional().default(""),
});

export type ContactInput = z.infer<typeof contactSchema>;

export function firstIssue(error: z.ZodError): { field?: ContactField; message: string } {
  const issue = error.issues[0];
  return { field: issue?.path[0] as ContactField | undefined, message: issue?.message ?? "Check the form and try again." };
}

export type { ContactField, ContactState } from "./contact-rules";
