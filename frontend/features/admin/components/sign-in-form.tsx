"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/features/admin/actions/auth-actions";
import type { SignInInput } from "@/features/admin/schemas/sign-in-schema";
import { signInSchema } from "@/features/admin/schemas/sign-in-schema";

interface SignInFormProps {
  /** Path the operator was trying to reach before being redirected here. */
  readonly next?: string;
}

export function SignInForm({ next }: SignInFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "", next },
  });

  async function onSubmit(values: SignInInput) {
    setFormError(null);

    const result = await signIn(values);

    if (!result.ok) {
      // Shown in the form rather than a toast: a sign-in failure is about
      // this form, and it must survive long enough to be read.
      setFormError(result.message);

      return;
    }

    router.replace(result.data.redirectTo);
    // The shell above this route is server-rendered from the session.
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      {formError !== null && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-email">Email</Label>
        <Input
          id="admin-email"
          type="email"
          autoComplete="username"
          autoFocus
          aria-invalid={errors.email !== undefined}
          {...register("email")}
        />
        {errors.email && (
          <p role="alert" className="text-xs text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-password">Password</Label>
        <Input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password !== undefined}
          {...register("password")}
        />
        {errors.password && (
          <p role="alert" className="text-xs text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <input type="hidden" {...register("next")} />

      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
