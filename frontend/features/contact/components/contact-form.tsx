"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactMessage } from "@/features/contact/actions/submit-contact-message";
import type { ContactMessageInput } from "@/features/contact/schemas/contact-schema";
import { contactMessageSchema } from "@/features/contact/schemas/contact-schema";
import { cn } from "@/lib/utils";

/**
 * The lead-capture form.
 *
 * Client-side validation mirrors the server schema so a mistake is caught
 * before a round trip, but the Server Action re-validates — the browser copy
 * is a convenience, never the gate.
 */
export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactMessageInput>({
    resolver: zodResolver(contactMessageSchema),
    defaultValues: { name: "", email: "", company: "", phone: "", subject: "", message: "" },
  });

  async function onSubmit(values: ContactMessageInput) {
    const result = await submitContactMessage(values);

    if (result.ok) {
      // The control said "Send message", so the confirmation says "Message sent".
      toast.success("Message sent", {
        description: "We usually reply within one business day.",
      });
      reset();

      return;
    }

    toast.error("Message not sent", { description: result.message });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message} required htmlFor="contact-name">
          <Input
            id="contact-name"
            autoComplete="name"
            aria-invalid={errors.name !== undefined}
            {...register("name")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message} required htmlFor="contact-email">
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email !== undefined}
            {...register("email")}
          />
        </Field>

        <Field label="Company" error={errors.company?.message} htmlFor="contact-company">
          <Input id="contact-company" autoComplete="organization" {...register("company")} />
        </Field>

        <Field label="Phone" error={errors.phone?.message} htmlFor="contact-phone">
          <Input id="contact-phone" type="tel" autoComplete="tel" {...register("phone")} />
        </Field>
      </div>

      <Field label="Subject" error={errors.subject?.message} htmlFor="contact-subject">
        <Input id="contact-subject" {...register("subject")} />
      </Field>

      <Field
        label="How can we help?"
        error={errors.message?.message}
        required
        htmlFor="contact-message"
        hint="Tell us what you are working on and what stage the funding is at."
      >
        <Textarea
          id="contact-message"
          rows={6}
          aria-invalid={errors.message !== undefined}
          {...register("message")}
        />
      </Field>

      <div className="flex items-center gap-4">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send message"}
        </Button>
        <p className="text-xs text-muted-foreground">We only use these details to reply to you.</p>
      </div>
    </form>
  );
}

interface FieldProps {
  readonly label: string;
  readonly htmlFor: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly hint?: string;
  readonly children: React.ReactNode;
}

/**
 * Label, control, hint and error in a fixed order, so every field announces
 * itself the same way to a screen reader.
 */
function Field({ label, htmlFor, error, required = false, hint, children }: FieldProps) {
  const hintId = hint === undefined ? undefined : `${htmlFor}-hint`;
  const errorId = error === undefined ? undefined : `${htmlFor}-error`;

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        )}
        {!required && <span className="text-xs font-normal text-muted-foreground">Optional</span>}
      </Label>

      <div aria-describedby={cn(hintId, errorId) || undefined}>{children}</div>

      {hint !== undefined && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}

      {error !== undefined && (
        <p id={errorId} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
