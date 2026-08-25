"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminCategory, AdminCountry, ReferenceOption } from "@/features/admin/repositories/reference-admin-repository";
import type { FundingLevel } from "@/features/admin/schemas/grant-edit-schema";

/** Everything the country/agency/category block needs, loaded once on the server. */
export interface GrantReferenceData {
  readonly countries: readonly AdminCountry[];
  readonly categories: readonly AdminCategory[];
  readonly agencies: readonly ReferenceOption[];
  readonly states: readonly ReferenceOption[];
}

export const NEW_AGENCY = "__new__";

const FUNDING_LEVEL_LABELS: Readonly<Record<FundingLevel, string>> = {
  // Wording avoids "federal", which means nothing in Italy and the wrong thing
  // in the UK. The stored flag is the same either way.
  national: "National government",
  regional: "State, regional or local government",
  private: "Foundation or private funder",
};

interface GrantClassificationFieldsProps {
  readonly data: GrantReferenceData;
  readonly countryId: string;
  readonly onCountryChange: (value: string) => void;
  readonly organizationId: string;
  readonly onOrganizationChange: (value: string) => void;
  readonly stateId: string;
  readonly onStateChange: (value: string) => void;
  readonly fundingLevel: FundingLevel;
  readonly onFundingLevelChange: (value: FundingLevel) => void;
  readonly categoryIds: readonly string[];
  readonly onCategoryToggle: (id: string, checked: boolean) => void;
  readonly primaryCategoryId: string | null;
  readonly onPrimaryCategoryChange: (id: string) => void;
  /** Only the create form can invent an agency; editing picks from what exists. */
  readonly allowNewAgency?: boolean;
  readonly newAgencyName?: string;
  readonly onNewAgencyNameChange?: (value: string) => void;
  readonly newAgencyWebsite?: string;
  readonly onNewAgencyWebsiteChange?: (value: string) => void;
  readonly errors?: Readonly<Record<string, string | undefined>>;
}

/**
 * Country, agency, region, funding level and categories.
 *
 * Shared between creating a grant and re-filing an existing one so the two
 * cannot drift: an operator who learns the form once has learned both.
 *
 * The country drives everything below it. Agencies and states are filtered to
 * the chosen country rather than listed in full — 151 agencies in one dropdown,
 * nearly all American, is how an Italian grant ends up filed under a US bureau.
 */
export function GrantClassificationFields({
  data,
  countryId,
  onCountryChange,
  organizationId,
  onOrganizationChange,
  stateId,
  onStateChange,
  fundingLevel,
  onFundingLevelChange,
  categoryIds,
  onCategoryToggle,
  primaryCategoryId,
  onPrimaryCategoryChange,
  allowNewAgency = false,
  newAgencyName = "",
  onNewAgencyNameChange,
  newAgencyWebsite = "",
  onNewAgencyWebsiteChange,
  errors = {},
}: GrantClassificationFieldsProps) {
  const country = data.countries.find((entry) => entry.id === countryId) ?? null;
  const agencies = data.agencies.filter((entry) => entry.countryId === countryId);
  const states = data.states.filter((entry) => entry.countryId === countryId);
  const addingAgency = allowNewAgency && organizationId === NEW_AGENCY;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <FieldShell label="Country" error={errors["countryId"]} required>
          <Select value={countryId} onValueChange={onCountryChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a country" />
            </SelectTrigger>
            <SelectContent>
              {data.countries.map((entry) => (
                <SelectItem key={entry.id} value={entry.id}>
                  {entry.name} ({entry.currency})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {country !== null && (
            <p className="text-xs text-muted-foreground">
              Awards will be recorded in {country.currency}.
            </p>
          )}
        </FieldShell>

        <FieldShell label="Funding agency" error={errors["organizationId"]} required>
          <Select
            value={organizationId}
            onValueChange={onOrganizationChange}
            disabled={countryId === ""}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={countryId === "" ? "Choose a country first" : "Choose an agency"}
              />
            </SelectTrigger>
            <SelectContent>
              {agencies.map((entry) => (
                <SelectItem key={entry.id} value={entry.id}>
                  {entry.name}
                </SelectItem>
              ))}
              {allowNewAgency && (
                <SelectItem value={NEW_AGENCY}>+ Add a new agency…</SelectItem>
              )}
            </SelectContent>
          </Select>
          {countryId !== "" && agencies.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No agencies recorded for this country yet
              {allowNewAgency ? " — add the first one below." : "."}
            </p>
          )}
        </FieldShell>
      </div>

      {addingAgency && (
        <div className="grid gap-6 rounded-md border border-dashed border-border p-4 sm:grid-cols-2">
          <FieldShell
            label="New agency name"
            error={errors["newOrganizationName"]}
            hint="Type the full official name, e.g. Ministero dell'Università e della Ricerca."
            required
          >
            <Input
              value={newAgencyName}
              onChange={(event) => onNewAgencyNameChange?.(event.target.value)}
            />
          </FieldShell>
          <FieldShell
            label="Agency website"
            error={errors["newOrganizationWebsite"]}
            hint="Optional. Used on the agency's own page."
          >
            <Input
              type="url"
              placeholder="https://"
              value={newAgencyWebsite}
              onChange={(event) => onNewAgencyWebsiteChange?.(event.target.value)}
            />
          </FieldShell>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <FieldShell
          label="Funding level"
          error={errors["fundingLevel"]}
          hint="Drives the federal / state / private filter on the public site."
        >
          <Select
            value={fundingLevel}
            onValueChange={(value) => onFundingLevelChange(value as FundingLevel)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FUNDING_LEVEL_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>

        {/* Only shown where the country actually has regions recorded. */}
        {states.length > 0 && (
          <FieldShell
            label="State or region"
            error={errors["stateId"]}
            hint="Leave unset for a grant that covers the whole country."
          >
            <Select value={stateId === "" ? "none" : stateId} onValueChange={onStateChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Whole country</SelectItem>
                {states.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
        )}
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-xs font-medium">
          Categories <span className="text-destructive">*</span>
        </legend>
        <p className="text-xs text-muted-foreground">
          A grant needs at least one before it can be published. The first one you tick becomes the
          primary category, which is the one shown in the breadcrumb.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.categories.map((category) => {
            const checked = categoryIds.includes(category.id);

            return (
              <div key={category.id} className="flex items-center gap-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={checked}
                  onCheckedChange={(next) => onCategoryToggle(category.id, next === true)}
                />
                <Label htmlFor={`category-${category.id}`} className="text-sm font-normal">
                  {category.name}
                </Label>
                {checked && category.id === primaryCategoryId && (
                  <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                    primary
                  </span>
                )}
                {checked && category.id !== primaryCategoryId && (
                  <button
                    type="button"
                    onClick={() => onPrimaryCategoryChange(category.id)}
                    className="rounded-sm font-mono text-[10px] tracking-widest text-muted-foreground uppercase underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    make primary
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {errors["categoryIds"] !== undefined && (
          <p role="alert" className="text-xs font-medium text-destructive">
            {errors["categoryIds"]}
          </p>
        )}
      </fieldset>
    </div>
  );
}

function FieldShell({
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
