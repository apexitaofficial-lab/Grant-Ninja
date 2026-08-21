import { z } from "zod";

import type { SettingField } from "@/features/admin/config/settings-fields";
import { findField } from "@/features/admin/config/settings-fields";
import type { Json } from "@/types/database";

/**
 * Turning form strings into the JSON each setting is stored as.
 *
 * `system_settings.value` is `jsonb`, and the types differ per key: a boolean
 * for indexing, a number for the threshold, an array for disallowed paths. A
 * form submits strings for all of them, so coercion has to be driven by the
 * field descriptor rather than guessed from the value — `"true"` stored as a
 * string would read as false everywhere it is consumed, silently.
 */

export interface CoercionResult {
  readonly value: Json;
  readonly error?: undefined;
}

export interface CoercionFailure {
  readonly value?: undefined;
  readonly error: string;
}

export function coerceSettingValue(
  field: SettingField,
  raw: string,
): CoercionResult | CoercionFailure {
  const trimmed = raw.trim();

  switch (field.kind) {
    case "boolean":
      // Checkboxes submit "on" when ticked and nothing when not; the form also
      // sends an explicit "true"/"false" for clarity.
      return { value: trimmed === "true" || trimmed === "on" };

    case "number": {
      if (trimmed === "") {
        return { error: `${field.label} needs a number.` };
      }

      const parsed = Number(trimmed);

      if (!Number.isFinite(parsed)) {
        return { error: `${field.label} must be a number.` };
      }

      if (field.min !== undefined && parsed < field.min) {
        return { error: `${field.label} cannot be below ${field.min}.` };
      }

      if (field.max !== undefined && parsed > field.max) {
        return { error: `${field.label} cannot be above ${field.max}.` };
      }

      return { value: parsed };
    }

    case "string-list":
      return {
        value: trimmed
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line !== ""),
      };

    case "email":
      if (trimmed !== "" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
        return { error: `${field.label} is not a valid email address.` };
      }

      return { value: trimmed };

    case "url":
      if (trimmed !== "" && !/^https?:\/\//.test(trimmed)) {
        return { error: `${field.label} must start with http:// or https://` };
      }

      return { value: trimmed };

    default:
      return { value: trimmed };
  }
}

/** Renders a stored JSON value back into what the form input expects. */
export function settingValueToInput(value: Json): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.filter((entry) => typeof entry === "string").join("\n");
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export const saveSettingsSchema = z.object({
  groupId: z.string().min(1),
  values: z.record(z.string(), z.string()),
});

export const socialProfileSchema = z.object({
  id: z.string().uuid(),
  url: z.string().trim().min(1, "A profile needs a URL."),
  isPrimary: z.coerce.boolean(),
  enabled: z.coerce.boolean(),
});

export function coerceGroup(
  values: Record<string, string>,
):
  | { readonly ok: true; readonly map: Map<string, Json> }
  | { readonly ok: false; readonly error: string } {
  const map = new Map<string, Json>();

  for (const [key, raw] of Object.entries(values)) {
    const field = findField(key);

    if (field === undefined) {
      // Only keys the descriptor knows about are writable. Anything else in
      // the payload is ignored rather than trusted.
      continue;
    }

    const result = coerceSettingValue(field, raw);

    if (result.error !== undefined) {
      return { ok: false, error: result.error };
    }

    map.set(key, result.value);
  }

  return { ok: true, map };
}
