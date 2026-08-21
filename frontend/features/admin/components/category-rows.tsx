"use client";

import { Badge } from "@/components/ui/badge";
import { saveCategory } from "@/features/admin/actions/reference-actions";
import type { EditableField } from "@/features/admin/components/reference-row-editor";
import { countLabel, ReferenceRowEditor } from "@/features/admin/components/reference-row-editor";
import type { AdminCategory } from "@/features/admin/repositories/reference-admin-repository";

const STATUS_OPTIONS = [
  { value: "active", label: "Active — offered as a filter" },
  { value: "inactive", label: "Inactive — hidden from filters" },
];

const FIELDS: readonly EditableField[] = [
  { name: "name", label: "Name", kind: "text" },
  {
    name: "slug",
    label: "Slug",
    kind: "slug",
    help: "The public URL segment. Changing it creates a permanent redirect from the old address.",
  },
  { name: "description", label: "Description", kind: "textarea" },
  {
    name: "icon",
    label: "Icon",
    kind: "text",
    help: "A Lucide icon name, such as HeartPulse. Not a path.",
  },
  {
    name: "sortOrder",
    label: "Sort order",
    kind: "number",
    help: "Lower numbers appear first. The catch-all sits at 999 so it stays last.",
  },
  { name: "status", label: "Status", kind: "select", options: STATUS_OPTIONS },
];

export function CategoryRows({ categories }: { readonly categories: readonly AdminCategory[] }) {
  return (
    <div>
      {categories.map((category) => (
        <ReferenceRowEditor
          key={category.id}
          title={category.name}
          subtitle={`/categories/${category.slug}`}
          summary={
            <span className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="font-mono tabular-nums">
                {countLabel(category.grantCount, "grant")}
              </span>
              {category.status !== "active" && <Badge variant="outline">{category.status}</Badge>}
            </span>
          }
          fields={FIELDS}
          values={{
            name: category.name,
            slug: category.slug,
            description: category.description ?? "",
            icon: category.icon ?? "",
            sortOrder: String(category.sortOrder),
            status: category.status,
          }}
          onSave={(values) => saveCategory({ ...values, id: category.id }, category.slug)}
        />
      ))}
    </div>
  );
}
