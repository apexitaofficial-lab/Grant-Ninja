"use client";

import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/errors";
import { cn } from "@/lib/utils";

export interface EditableField {
  readonly name: string;
  readonly label: string;
  readonly kind: "text" | "textarea" | "number" | "url" | "slug" | "select";
  readonly help?: string;
  readonly options?: readonly { readonly value: string; readonly label: string }[];
}

export interface ReferenceSaveOutcome {
  readonly redirectFrom: string | null;
}

/** "1 grant", "0 grants". Sounds trivial; "1 grants" reads as a bug. */
export function countLabel(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

interface ReferenceRowEditorProps {
  readonly title: string;
  readonly subtitle: string;
  /** Rendered on the collapsed row — counts, status, whatever matters at a glance. */
  readonly summary: React.ReactNode;
  readonly fields: readonly EditableField[];
  readonly values: Readonly<Record<string, string>>;
  readonly onSave: (values: Record<string, string>) => Promise<ActionResult<ReferenceSaveOutcome>>;
}

/**
 * One expandable row.
 *
 * A row rather than a separate edit page: these are short records, there are
 * up to 148 of them, and the common task is correcting one field. Making that
 * a navigation round trip for each would turn a minute of work into ten.
 */
export function ReferenceRowEditor({
  title,
  subtitle,
  summary,
  fields,
  values,
  onSave,
}: ReferenceRowEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({ ...values });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const isDirty = fields.some((field) => draft[field.name] !== values[field.name]);
  const slugField = fields.find((field) => field.kind === "slug");
  const slugChanged = slugField !== undefined && draft[slugField.name] !== values[slugField.name];

  async function save() {
    setBusy(true);
    setError(null);
    setNote(null);

    try {
      const result = await onSave(draft);

      if (!result.ok) {
        setError(result.message);

        return;
      }

      setNote(
        result.data.redirectFrom === null
          ? "Saved."
          : `Saved. ${result.data.redirectFrom} now redirects to the new address.`,
      );
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-1 py-3 text-left hover:bg-muted/40"
      >
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
        <span className="flex-1">
          <span className="block text-sm font-medium">{title}</span>
          <span className="block font-mono text-xs text-muted-foreground">{subtitle}</span>
        </span>
        {summary}
      </button>

      {open && (
        <div className="flex flex-col gap-5 border-t border-border bg-muted/20 px-4 py-5">
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col gap-2">
              <Label htmlFor={`${title}-${field.name}`} className="text-xs">
                {field.label}
              </Label>

              {field.kind === "textarea" ? (
                <Textarea
                  id={`${title}-${field.name}`}
                  rows={3}
                  value={draft[field.name] ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                />
              ) : field.kind === "select" ? (
                <select
                  id={`${title}-${field.name}`}
                  value={draft[field.name] ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={`${title}-${field.name}`}
                  type={field.kind === "number" ? "number" : "text"}
                  value={draft[field.name] ?? ""}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, [field.name]: event.target.value }))
                  }
                  className={
                    field.kind === "slug" || field.kind === "number"
                      ? "max-w-sm font-mono text-xs"
                      : undefined
                  }
                />
              )}

              {field.help !== undefined && (
                <p className="text-xs text-muted-foreground">{field.help}</p>
              )}
            </div>
          ))}

          {slugChanged && (
            <p className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-warning">
              Changing the slug changes a public URL. The old address will be kept as a permanent
              redirect, so existing links and search results keep working — but the new address is
              what will be indexed from now on.
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="button" size="sm" onClick={save} disabled={busy || !isDirty}>
              {busy ? "Saving…" : "Save"}
            </Button>
            {!isDirty && !busy && <span className="text-xs text-muted-foreground">No changes</span>}
            {note !== null && <span className="text-xs font-medium text-success">{note}</span>}
            {error !== null && (
              <span role="alert" className="text-xs font-medium text-destructive">
                {error}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
