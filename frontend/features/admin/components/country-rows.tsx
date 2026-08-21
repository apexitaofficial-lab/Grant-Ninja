"use client";

import { Badge } from "@/components/ui/badge";
import { saveCountry } from "@/features/admin/actions/reference-actions";
import type { EditableField } from "@/features/admin/components/reference-row-editor";
import { countLabel, ReferenceRowEditor } from "@/features/admin/components/reference-row-editor";
import type { AdminCountry } from "@/features/admin/repositories/reference-admin-repository";

const STATUS_OPTIONS = [
  { value: "active", label: "Active — visible on the public site" },
  { value: "inactive", label: "Inactive — hidden from the public site" },
];

const FIELDS: readonly EditableField[] = [
  { name: "name", label: "Name", kind: "text" },
  {
    name: "slug",
    label: "Slug",
    kind: "slug",
    help: "The public URL segment. Changing it creates a permanent redirect from the old address.",
  },
  {
    name: "currency",
    label: "Currency",
    kind: "text",
    help: "Three-letter ISO code. Award amounts for this country are displayed in it.",
  },
  { name: "description", label: "Description", kind: "textarea" },
  { name: "status", label: "Status", kind: "select", options: STATUS_OPTIONS },
];

export function CountryRows({ countries }: { readonly countries: readonly AdminCountry[] }) {
  return (
    <div>
      {countries.map((country) => (
        <ReferenceRowEditor
          key={country.id}
          title={country.name}
          subtitle={`/countries/${country.slug} · ${country.isoCode} · ${country.currency}`}
          summary={
            <span className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono tabular-nums">
                {countLabel(country.grantCount, "grant")}
              </span>
              <span className="font-mono tabular-nums">
                {countLabel(country.organizationCount, "agency", "agencies")}
              </span>
              {country.status !== "active" && <Badge variant="outline">{country.status}</Badge>}
            </span>
          }
          fields={FIELDS}
          values={{
            name: country.name,
            slug: country.slug,
            currency: country.currency,
            description: country.description ?? "",
            status: country.status,
          }}
          onSave={(values) => saveCountry({ ...values, id: country.id }, country.slug)}
        />
      ))}
    </div>
  );
}
