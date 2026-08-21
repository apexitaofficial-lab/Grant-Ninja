import { z } from "zod";

/**
 * Shared by the browser form and the Server Action.
 *
 * One schema, validated twice: the client copy gives immediate feedback, the
 * server copy is the one that decides. Client validation is a convenience and
 * is never trusted — AI_ENGINEERING_GUIDE.md §15.
 *
 * Bounds match the database check constraints, so a value that passes here
 * cannot be rejected by Postgres.
 */
export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(200, "Name must be under 200 characters"),
  email: z.email("Enter a valid email address").max(320, "Email address is too long"),
  company: z.string().trim().max(200, "Company must be under 200 characters").optional(),
  phone: z.string().trim().max(50, "Phone number is too long").optional(),
  subject: z.string().trim().max(200, "Subject must be under 200 characters").optional(),
  message: z
    .string()
    .trim()
    .min(10, "Tell us a little more — at least 10 characters")
    .max(5000, "Message must be under 5000 characters"),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
