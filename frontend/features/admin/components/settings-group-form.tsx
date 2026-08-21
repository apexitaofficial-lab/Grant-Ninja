"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveSettings } from "@/features/admin/actions/settings-actions";
import type { SettingField, SettingGroup } from "@/features/admin/config/settings-fields";

interface SettingsGroupFormProps {
  readonly group: SettingGroup;
  /** Current value per key, already rendered as form input text. */
  readonly values: Readonly<Record<string, string>>;
}

export function SettingsGroupForm({ group, values }: SettingsGroupFormProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<Record<string, string>>({ ...values });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  const isDirty = group.fields.some((field) => draft[field.key] !== values[field.key]);

  function update(key: string, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  }

  async function onSave() {
    setBusy(true);
    setFeedback(null);

    try {
      const payload = Object.fromEntries(
        group.fields.map((field) => [field.key, draft[field.key] ?? ""]),
      );

      const result = await saveSettings({ groupId: group.id, values: payload });

      if (!result.ok) {
        setFeedback({ tone: "error", message: result.message });

        return;
      }

      setFeedback({
        tone: "ok",
        message: `Saved ${result.data.saved} setting${result.data.saved === 1 ? "" : "s"}.`,
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby={`settings-${group.id}`} className="flex flex-col gap-5">
      <div>
        <h2 id={`settings-${group.id}`} className="text-base font-semibold">
          {group.title}
        </h2>
        <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          {group.description}
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {group.fields.map((field) => (
          <SettingInput
            key={field.key}
            field={field}
            value={draft[field.key] ?? ""}
            onChange={(value) => update(field.key, value)}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" onClick={onSave} disabled={busy || !isDirty}>
          {busy ? "Saving…" : "Save"}
        </Button>
        {!isDirty && !busy && <span className="text-xs text-muted-foreground">No changes</span>}
        {feedback !== null && (
          <span
            role="status"
            className={
              feedback.tone === "error"
                ? "text-xs font-medium text-destructive"
                : "text-xs font-medium text-success"
            }
          >
            {feedback.message}
          </span>
        )}
      </div>
    </section>
  );
}

function SettingInput({
  field,
  value,
  onChange,
}: {
  readonly field: SettingField;
  readonly value: string;
  readonly onChange: (value: string) => void;
}) {
  const id = `setting-${field.key}`;

  if (field.kind === "boolean") {
    return (
      <div className="flex items-start gap-3">
        <Checkbox
          id={id}
          checked={value === "true"}
          onCheckedChange={(checked) => onChange(checked === true ? "true" : "false")}
        />
        <div className="flex flex-col gap-1">
          <Label htmlFor={id} className="text-sm font-normal">
            {field.label}
          </Label>
          {field.help !== undefined && (
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{field.help}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="text-xs">
        {field.label}
      </Label>

      {field.kind === "textarea" || field.kind === "string-list" ? (
        <Textarea
          id={id}
          rows={field.kind === "string-list" ? 4 : 5}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={field.kind === "string-list" ? "font-mono text-xs" : undefined}
        />
      ) : field.kind === "color" ? (
        <div className="flex items-center gap-2">
          <Input
            id={id}
            type="color"
            value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#104577"}
            onChange={(event) => onChange(event.target.value)}
            className="h-9 w-16 p-1"
          />
          <Input
            aria-label={`${field.label} value`}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="max-w-40 font-mono text-xs"
          />
        </div>
      ) : (
        <Input
          id={id}
          type={inputType(field)}
          min={field.min}
          max={field.max}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={field.kind === "number" ? "max-w-40 font-mono tabular-nums" : undefined}
        />
      )}

      {field.help !== undefined && (
        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{field.help}</p>
      )}
    </div>
  );
}

function inputType(field: SettingField): string {
  switch (field.kind) {
    case "number":
      return "number";
    case "email":
      return "email";
    case "tel":
      return "tel";
    case "url":
      return "url";
    default:
      return "text";
  }
}
