"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/config/routes";
import { createGrant } from "@/features/admin/actions/grant-actions";
import type { GrantReferenceData } from "@/features/admin/components/grant-classification-fields";
import {
  GrantClassificationFields,
  NEW_AGENCY,
} from "@/features/admin/components/grant-classification-fields";
import type { FundingLevel } from "@/features/admin/schemas/grant-edit-schema";
import { grantCreateSchema } from "@/features/admin/schemas/grant-edit-schema";

/**
 * Statuses a person can choose when creating a grant.
 *
 * `archived` and `expired` are absent on purpose: creating something already
 * archived is not a thing anyone means to do, and expiry is derived from the
 * closing date rather than declared.
 */
const CREATE_STATUSES = [
  { value: "draft", label: "Draft — not visible on the site" },
  { value: "pending_review", label: "Pending review — queued for a second pair of eyes" },
  { value: "published", label: "Published — live on the public site" },
] as const;

interface GrantCreateFormProps {
  readonly data: GrantReferenceData;
}

/**
 * Adds a grant by hand, for any country.
 *
 * Held in plain state rather than react-hook-form: the country drives which
 * agencies and regions exist, categories are a multi-select with a primary, and
 * the agency field can create its own row. Expressing that as registered inputs
 * costs more than it saves. Validation is the same Zod schema the server uses,
 * run on submit, so the two cannot disagree about what is valid.
 */
export function GrantCreateForm({ data }: GrantCreateFormProps) {
  const router = useRouter();

  const [countryId, setCountryId] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [newAgencyName, setNewAgencyName] = useState("");
  const [newAgencyWebsite, setNewAgencyWebsite] = useState("");
  const [stateId, setStateId] = useState("");
  const [fundingLevel, setFundingLevel] = useState<FundingLevel>("national");
  const [categoryIds, setCategoryIds] = useState<readonly string[]>([]);
  const [primaryCategoryId, setPrimaryCategoryId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [minimumAmount, setMinimumAmount] = useState("");
  const [maximumAmount, setMaximumAmount] = useState("");
  const [officialUrl, setOfficialUrl] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [status, setStatus] = useState<string>("draft");

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const country = data.countries.find((entry) => entry.id === countryId) ?? null;
  const currency = country?.currency ?? "";

  // Changing country invalidates the agency and region beneath it. Leaving a
  // stale agency selected is how a UK grant keeps a US funder.
  function handleCountryChange(next: string) {
    setCountryId(next);
    setOrganizationId("");
    setStateId("");
  }

  function handleCategoryToggle(id: string, checked: boolean) {
    setCategoryIds((current) => {
      const next = checked ? [...current, id] : current.filter((entry) => entry !== id);

      setPrimaryCategoryId((primary) => {
        if (checked && primary === null) {
          return id;
        }

        // Unticking the primary promotes whatever remains, so a grant is never
        // left with categories but no primary.
        return primary === id && !checked ? (next[0] ?? null) : primary;
      });

      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setErrors({});

    const payload = {
      title,
      countryId,
      organizationId: organizationId === NEW_AGENCY || organizationId === "" ? null : organizationId,
      newOrganizationName: organizationId === NEW_AGENCY ? newAgencyName : "",
      newOrganizationWebsite: organizationId === NEW_AGENCY ? newAgencyWebsite : "",
      stateId: stateId === "" ? null : stateId,
      categoryIds: [...categoryIds],
      primaryCategoryId,
      fundingLevel,
      shortDescription,
      fullDescription,
      eligibility,
      minimumAmount,
      maximumAmount,
      officialUrl,
      applicationUrl,
      opensAt,
      closesAt,
      status,
    };

    const parsed = grantCreateSchema.safeParse(payload);

    if (!parsed.success) {
      const next: Record<string, string | undefined> = {};

      for (const issue of parsed.error.issues) {
        const key = issue.path[0];

        if (typeof key === "string" && next[key] === undefined) {
          next[key] = issue.message;
        }
      }

      setErrors(next);
      setFormError("Some details need attention before this can be saved.");

      return;
    }

    setSubmitting(true);

    const result = await createGrant(payload);

    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.message);

      return;
    }

    // Straight to the grant's own page: the next thing anyone does after
    // creating one is check it, and the id is only known now.
    router.push(routes.admin.grant(result.data.grantId));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {formError !== null && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="classification" className="flex flex-col gap-4">
        <SectionHeading id="classification">Where it belongs</SectionHeading>
        <GrantClassificationFields
          data={data}
          countryId={countryId}
          onCountryChange={handleCountryChange}
          organizationId={organizationId}
          onOrganizationChange={setOrganizationId}
          stateId={stateId}
          onStateChange={(value) => setStateId(value === "none" ? "" : value)}
          fundingLevel={fundingLevel}
          onFundingLevelChange={setFundingLevel}
          categoryIds={categoryIds}
          onCategoryToggle={handleCategoryToggle}
          primaryCategoryId={primaryCategoryId}
          onPrimaryCategoryChange={setPrimaryCategoryId}
          allowNewAgency
          newAgencyName={newAgencyName}
          onNewAgencyNameChange={setNewAgencyName}
          newAgencyWebsite={newAgencyWebsite}
          onNewAgencyWebsiteChange={setNewAgencyWebsite}
          errors={errors}
        />
      </section>

      <section aria-labelledby="content" className="flex flex-col gap-6">
        <SectionHeading id="content">What it is</SectionHeading>

        <Field label="Title" error={errors["title"]} required>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Innovation Grant for Small Businesses 2026"
          />
        </Field>

        <Field
          label="Short description"
          hint="One or two sentences. Shown on grant cards and in search results."
          error={errors["shortDescription"]}
        >
          <Textarea
            rows={3}
            value={shortDescription}
            onChange={(event) => setShortDescription(event.target.value)}
          />
        </Field>

        <Field
          label="Full description"
          hint="The detail from the official notice. Write it in your own words rather than pasting the whole page."
          error={errors["fullDescription"]}
        >
          <Textarea
            rows={8}
            value={fullDescription}
            onChange={(event) => setFullDescription(event.target.value)}
          />
        </Field>

        <Field
          label="Eligibility"
          hint="Who can apply."
          error={errors["eligibility"]}
        >
          <Textarea
            rows={5}
            value={eligibility}
            onChange={(event) => setEligibility(event.target.value)}
          />
        </Field>
      </section>

      <section aria-labelledby="money" className="flex flex-col gap-6">
        <SectionHeading id="money">Money and dates</SectionHeading>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label={currency === "" ? "Minimum award" : `Minimum award (${currency})`}
            hint="Leave empty when the notice states no floor."
            error={errors["minimumAmount"]}
          >
            <Input
              type="number"
              min={0}
              step="1000"
              value={minimumAmount}
              onChange={(event) => setMinimumAmount(event.target.value)}
            />
          </Field>

          <Field
            label={currency === "" ? "Maximum award" : `Maximum award (${currency})`}
            error={errors["maximumAmount"]}
          >
            <Input
              type="number"
              min={0}
              step="1000"
              value={maximumAmount}
              onChange={(event) => setMaximumAmount(event.target.value)}
            />
          </Field>

          <Field label="Opens" error={errors["opensAt"]}>
            <Input
              type="date"
              value={opensAt}
              onChange={(event) => setOpensAt(event.target.value)}
            />
          </Field>

          <Field
            label="Closes"
            hint="The application deadline. Leave empty for a rolling programme."
            error={errors["closesAt"]}
          >
            <Input
              type="date"
              value={closesAt}
              onChange={(event) => setClosesAt(event.target.value)}
            />
          </Field>
        </div>
      </section>

      <section aria-labelledby="links" className="flex flex-col gap-6">
        <SectionHeading id="links">Links</SectionHeading>

        <Field
          label="Official URL"
          hint="The agency's own page for this grant. Required before it can be published — it is what a reader checks us against."
          error={errors["officialUrl"]}
        >
          <Input
            type="url"
            placeholder="https://"
            value={officialUrl}
            onChange={(event) => setOfficialUrl(event.target.value)}
          />
        </Field>

        <Field
          label="Application URL"
          hint="Where an applicant actually applies, if that differs from the notice."
          error={errors["applicationUrl"]}
        >
          <Input
            type="url"
            placeholder="https://"
            value={applicationUrl}
            onChange={(event) => setApplicationUrl(event.target.value)}
          />
        </Field>
      </section>

      <section aria-labelledby="publish" className="flex flex-col gap-6">
        <SectionHeading id="publish">Publish</SectionHeading>

        <Field label="Status" error={errors["status"]}>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full sm:w-[420px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CREATE_STATUSES.map((entry) => (
                <SelectItem key={entry.value} value={entry.value}>
                  {entry.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Create grant"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </section>
    </form>
  );
}

function SectionHeading({ id, children }: { readonly id: string; readonly children: string }) {
  return (
    <h2
      id={id}
      className="border-b border-border pb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase"
    >
      {children}
    </h2>
  );
}

function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly error?: string;
  readonly required?: boolean;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs">
        {label}
        {required === true && <span className="text-destructive"> *</span>}
      </Label>
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
