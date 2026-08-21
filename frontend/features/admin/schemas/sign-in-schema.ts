import { z } from "zod";

/**
 * Lives apart from the Server Action on purpose.
 *
 * A `"use server"` module may only export async functions — every export
 * becomes a callable server endpoint. Exporting a schema object from it fails
 * at runtime with "can only export async functions", which no type check
 * catches. Shared values belong in a plain module like this one.
 */
export const signInSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
  /** Where to land after signing in. Validated server-side before use. */
  next: z.string().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
