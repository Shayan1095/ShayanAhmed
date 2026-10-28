import { z } from "zod";

/** Shared by the contact form (instant feedback) and the server action (the real check). */
export const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120, "Use a shorter name."),
  email: z
    .string()
    .trim()
    .pipe(z.email("Enter a valid email address, like name@company.com."))
    .pipe(z.string().max(200)),
  projectType: z.string().trim().max(80).optional().default(""),
  budget: z.string().trim().max(80).optional().default(""),
  message: z
    .string()
    .trim()
    .min(10, "Tell me a little more about the project, at least a sentence.")
    .max(5000, "Keep the message under 5,000 characters."),
  /** Honeypot. Real people never fill it. */
  website: z.string().max(0).optional().default(""),
});

export type ContactInput = z.infer<typeof contactSchema>;
export type ContactField = keyof ContactInput;

export type ContactState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "error"; message: string; fix?: string; field?: ContactField };

export function firstIssue(error: z.ZodError): { field?: ContactField; message: string } {
  const issue = error.issues[0];
  return { field: issue?.path[0] as ContactField | undefined, message: issue?.message ?? "Check the form and try again." };
}
