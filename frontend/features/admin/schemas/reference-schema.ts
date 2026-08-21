import { z } from "zod";

/**
 * Editing countries, categories and agencies.
 *
 * The slug is validated to the same pattern the database enforces
 * (`^[a-z0-9]+(-[a-z0-9]+)*$`) so a bad value is rejected by the form with a
 * readable message rather than by a constraint with a name.
 */

const slug = z
  .string()
  .trim()
  .min(1, "A slug is required.")
  .max(80)
  .regex(
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens — no spaces or capitals.",
  );

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

const optionalUrl = optionalText.refine(
  (value) => value === null || /^https?:\/\//.test(value),
  "A website must start with http:// or https://",
);

/** `entity_status` has exactly these two values — there is no archived state. */
const status = z.enum(["active", "inactive"]);

export const countryEditSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, "A name needs at least two characters.").max(120),
  slug,
  currency: z
    .string()
    .trim()
    .length(3, "Use the three-letter ISO currency code, such as USD.")
    .transform((value) => value.toUpperCase()),
  description: optionalText,
  status,
});

export const categoryEditSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, "A name needs at least two characters.").max(120),
  slug,
  description: optionalText,
  icon: optionalText,
  sortOrder: z.coerce.number().int().min(0).max(9999),
  status,
});

export const agencyEditSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, "A name needs at least two characters.").max(200),
  slug,
  website: optionalUrl,
  description: optionalText,
  organizationType: z.enum([
    "government_federal",
    "government_state",
    "government_local",
    "university",
    "research_council",
    "innovation_agency",
    "foundation",
    "private",
  ]),
  status,
});

export type CountryEditInput = z.input<typeof countryEditSchema>;
export type CategoryEditInput = z.input<typeof categoryEditSchema>;
export type AgencyEditInput = z.input<typeof agencyEditSchema>;
