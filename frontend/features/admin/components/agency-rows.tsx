"use client";

import { Badge } from "@/components/ui/badge";
import { saveAgency } from "@/features/admin/actions/reference-actions";
import type { EditableField } from "@/features/admin/components/reference-row-editor";
import { countLabel, ReferenceRowEditor } from "@/features/admin/components/reference-row-editor";
import type { AdminAgency } from "@/features/admin/repositories/reference-admin-repository";

const TYPE_OPTIONS = [
  { value: "government_federal", label: "Federal government" },
  { value: "government_state", label: "State government" },
  { value: "government_local", label: "Local government" },
  { value: "university", label: "University" },
  { value: "research_council", label: "Research council" },
  { value: "innovation_agency", label: "Innovation agency" },
  { value: "foundation", label: "Foundation" },
  { value: "private", label: "Private" },
];

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
    name: "website",
    label: "Website",
    kind: "url",
    help: "The agency's own site, not its grants.gov listing.",
  },
  { name: "description", label: "Description", kind: "textarea" },
  { name: "organizationType", label: "Type", kind: "select", options: TYPE_OPTIONS },
  { name: "status", label: "Status", kind: "select", options: STATUS_OPTIONS },
];

export function AgencyRows({ agencies }: { readonly agencies: readonly AdminAgency[] }) {
  return (
    <div>
      {agencies.map((agency) => (
        <ReferenceRowEditor
          key={agency.id}
          title={agency.name}
          subtitle={`/agencies/${agency.slug}${agency.countryName === "" ? "" : ` · ${agency.countryName}`}`}
          summary={
            <span className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono tabular-nums">
                {countLabel(agency.grantCount, "grant")}
              </span>
              {agency.status !== "active" && <Badge variant="outline">{agency.status}</Badge>}
            </span>
          }
          fields={FIELDS}
          values={{
            name: agency.name,
            slug: agency.slug,
            website: agency.website ?? "",
            description: agency.description ?? "",
            organizationType: agency.organizationType,
            status: agency.status,
          }}
          onSave={(values) => saveAgency({ ...values, id: agency.id }, agency.slug)}
        />
      ))}
    </div>
  );
}
