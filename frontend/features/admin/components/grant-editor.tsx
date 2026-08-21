"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveGrant } from "@/features/admin/actions/grant-actions";
import type { AdminGrantDetail } from "@/features/admin/repositories/grant-admin-repository";
import type { GrantEditInput, GrantEditValues } from "@/features/admin/schemas/grant-edit-schema";
import { grantEditSchema } from "@/features/admin/schemas/grant-edit-schema";

/** `<input type="date">` wants `YYYY-MM-DD`; the database returns a timestamp. */
function toDateInput(value: string | null): string {
  return value === null ? "" : value.slice(0, 10);
}

function toText(value: string | null): string {
  return value ?? "";
}

function toAmount(value: number | null): string {
  return value === null ? "" : String(value);
}

export function GrantEditor({ grant }: { readonly grant: AdminGrantDetail }) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    // Three type parameters because the schema *transforms*: the form holds
    // strings from the inputs, the action receives numbers and nulls. Typing
    // it with one would force a cast somewhere and lose that distinction.
  } = useForm<GrantEditInput, unknown, GrantEditValues>({
    resolver: zodResolver(grantEditSchema),
    defaultValues: {
      grantId: grant.id,
      title: grant.title,
      shortDescription: toText(grant.shortDescription),
      fullDescription: toText(grant.fullDescription),
      eligibility: toText(grant.eligibility),
      minimumAmount: toAmount(grant.minimumAmount),
      maximumAmount: toAmount(grant.maximumAmount),
      officialUrl: toText(grant.officialUrl),
      applicationUrl: toText(grant.applicationUrl),
      opensAt: toDateInput(grant.opensAt),
      closesAt: toDateInput(grant.closesAt),
      changeReason: "",
    },
  });

  async function onSubmit(values: GrantEditValues) {
    setFormError(null);
    setSaved(false);

    const result = await saveGrant(values);

    if (!result.ok) {
      setFormError(result.message);

      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <input type="hidden" {...register("grantId")} />

      {formError !== null && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      {saved && (
        <Alert role="status">
          <AlertDescription>
            Saved. Version {grant.currentVersion + 1} recorded with a history entry.
          </AlertDescription>
        </Alert>
      )}

      <Field label="Title" error={errors.title?.message}>
        <Input {...register("title")} />
      </Field>

      <Field
        label="Short description"
        hint="Shown on grant cards and in search results."
        error={errors.shortDescription?.message}
      >
        <Textarea rows={3} {...register("shortDescription")} />
      </Field>

      <Field label="Full description" error={errors.fullDescription?.message}>
        <Textarea rows={8} {...register("fullDescription")} />
      </Field>

      <Field label="Eligibility" error={errors.eligibility?.message}>
        <Textarea rows={5} {...register("eligibility")} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field
          label={`Minimum award (${grant.currency})`}
          hint="Leave empty when the notice states no floor."
          error={errors.minimumAmount?.message}
        >
          <Input type="number" min={0} step="1000" {...register("minimumAmount")} />
        </Field>

        <Field label={`Maximum award (${grant.currency})`} error={errors.maximumAmount?.message}>
          <Input type="number" min={0} step="1000" {...register("maximumAmount")} />
        </Field>

        <Field label="Opens" error={errors.opensAt?.message}>
          <Input type="date" {...register("opensAt")} />
        </Field>

        <Field label="Closes" error={errors.closesAt?.message}>
          <Input type="date" {...register("closesAt")} />
        </Field>
      </div>

      <Field label="Official URL" error={errors.officialUrl?.message}>
        <Input type="url" {...register("officialUrl")} />
      </Field>

      <Field label="Application URL" error={errors.applicationUrl?.message}>
        <Input type="url" {...register("applicationUrl")} />
      </Field>

      <Field
        label="Reason for this change"
        hint="Recorded in the grant's history. Optional, but it is what makes the trail readable later."
        error={errors.changeReason?.message}
      >
        <Input
          placeholder="Corrected the closing date from the notice"
          {...register("changeReason")}
        />
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving…" : "Save changes"}
        </Button>
        {!isDirty && <span className="text-xs text-muted-foreground">No changes yet</span>}
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint !== undefined && error === undefined && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error !== undefined && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
