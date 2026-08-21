import { z } from "zod";

/**
 * What an operator may change by hand.
 *
 * Deliberately not everything. Slug, organization, country and content hash
 * are omitted: the slug is a published URL, the foreign keys are resolved by
 * the pipeline against reference data, and the hash is change-detection state.
 * Editing any of them by free text is how a directory acquires broken links
 * and grants filed under agencies that do not exist.
 */

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

const optionalUrl = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .refine(
    (value) => value === null || /^https?:\/\//.test(value),
    "Links must start with http:// or https://",
  );

const optionalAmount = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : Number(value)))
  .nullable()
  .refine(
    (value) => value === null || (Number.isFinite(value) && value >= 0),
    "Amounts must be zero or more.",
  );

const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const grantEditSchema = z
  .object({
    grantId: z.string().uuid(),
    title: z.string().trim().min(3, "A title needs at least three characters.").max(300),
    shortDescription: optionalText,
    fullDescription: optionalText,
    eligibility: optionalText,
    minimumAmount: optionalAmount,
    maximumAmount: optionalAmount,
    officialUrl: optionalUrl,
    applicationUrl: optionalUrl,
    opensAt: optionalDate,
    closesAt: optionalDate,
    featured: z.coerce.boolean().optional(),
    changeReason: z.string().trim().max(300).optional(),
  })
  .refine(
    (values) =>
      values.minimumAmount === null ||
      values.maximumAmount === null ||
      values.minimumAmount <= values.maximumAmount,
    { message: "The minimum award cannot exceed the maximum.", path: ["minimumAmount"] },
  )
  .refine(
    (values) =>
      values.opensAt === null ||
      values.closesAt === null ||
      new Date(values.opensAt) <= new Date(values.closesAt),
    { message: "The closing date cannot come before the opening date.", path: ["closesAt"] },
  );

export type GrantEditInput = z.input<typeof grantEditSchema>;
export type GrantEditValues = z.output<typeof grantEditSchema>;

export const GRANT_STATUSES = [
  "draft",
  "pending_review",
  "published",
  "archived",
  "expired",
] as const;

export const grantStatusSchema = z.object({
  grantId: z.string().uuid(),
  status: z.enum(GRANT_STATUSES),
  reason: z.string().trim().max(300).optional(),
});
