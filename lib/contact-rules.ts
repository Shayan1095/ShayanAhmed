/**
 * Contact form rules without dependencies, so the browser can give instant
 * feedback without shipping a validation library. The server re-checks the
 * same rules with zod (lib/contact-schema.ts), using these exact messages.
 */

export const contactLimits = { name: 120, email: 200, short: 80, messageMin: 10, messageMax: 5000 } as const;

export const contactMessages = {
  name: "Enter your name.",
  nameLong: "Use a shorter name.",
  email: "Enter a valid email address, like name@company.com.",
  messageShort: "Tell me a little more about the project, at least a sentence.",
  messageLong: "Keep the message under 5,000 characters.",
} as const;

export type ContactField = "name" | "email" | "projectType" | "budget" | "message" | "website";

export type ContactState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "error"; message: string; fix?: string; field?: ContactField };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Instant client-side check. Returns the first problem, or null. Ignores the honeypot. */
export function checkContact(data: Record<string, FormDataEntryValue>): { field: ContactField; message: string } | null {
  const v = (k: string) => String(data[k] ?? "").trim();
  const name = v("name");
  const email = v("email");
  const message = v("message");
  if (!name) return { field: "name", message: contactMessages.name };
  if (name.length > contactLimits.name) return { field: "name", message: contactMessages.nameLong };
  if (!EMAIL.test(email) || email.length > contactLimits.email) return { field: "email", message: contactMessages.email };
  if (message.length < contactLimits.messageMin) return { field: "message", message: contactMessages.messageShort };
  if (message.length > contactLimits.messageMax) return { field: "message", message: contactMessages.messageLong };
  return null;
}
