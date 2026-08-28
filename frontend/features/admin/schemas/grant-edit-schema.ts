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

/**
 * Where a grant's money comes from.
 *
 * Expressed as a level rather than as the two booleans the table stores, so the
 * form asks one question with three answers instead of two questions that can
 * contradict each other. "National" is the enum's federal flag — an Italian
 * ministry and a US federal agency are the same level, whatever the country
 * calls it.
 */
export const FUNDING_LEVELS = ["national", "regional", "private"] as const;

export type FundingLevel = (typeof FUNDING_LEVELS)[number];

export function toFundingFlags(level: FundingLevel): {
  readonly isFederal: boolean;
  readonly isPrivate: boolean;
} {
  return {
    isFederal: level === "national",
    isPrivate: level === "private",
  };
}

export function fromFundingFlags(isFederal: boolean, isPrivate: boolean): FundingLevel {
  if (isPrivate) {
    return "private";
  }

  return isFederal ? "national" : "regional";
}

/**
 * Creating a grant asks for more than editing one.
 *
 * The edit form deliberately omits country, agency and categories because the
 * crawler resolves those. Nothing resolves them for a grant typed in by hand,
 * so creation has to ask — and for the UK and Italy, where there is no crawler
 * source at all, this is the only way a grant gets into the directory.
 */
export const grantCreateSchema = z
  .object({
    title: z.string().trim().min(3, "A title needs at least three characters.").max(300),
    countryId: z.string().uuid("Choose a country."),

    // Either pick an existing agency or name a new one. A country with no
    // agencies yet — which is every country except the United States — would
    // otherwise be a dead end on the second field.
    organizationId: z.string().uuid().nullable().optional(),
    newOrganizationName: z.string().trim().max(200).optional(),
    newOrganizationWebsite: optionalUrl.optional(),

    stateId: z.string().uuid().nullable().optional(),
    categoryIds: z.array(z.string().uuid()).default([]),
    primaryCategoryId: z.string().uuid().nullable().optional(),
    fundingLevel: z.enum(FUNDING_LEVELS).default("national"),

    shortDescription: optionalText,
    fullDescription: optionalText,
    eligibility: optionalText,
    minimumAmount: optionalAmount,
    maximumAmount: optionalAmount,
    officialUrl: optionalUrl,
    applicationUrl: optionalUrl,
    opensAt: optionalDate,
    closesAt: optionalDate,
    status: z.enum(GRANT_STATUSES).default("draft"),
    changeReason: z.string().trim().max(300).optional(),
  })
  .refine(
    (values) =>
      (values.organizationId ?? null) !== null ||
      (values.newOrganizationName ?? "").trim() !== "",
    {
      message: "Choose an existing agency or enter a new one.",
      path: ["organizationId"],
    },
  )
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
  )
  // Both of these are enforced by the database too. Catching them here turns a
  // constraint violation into a sentence naming the field to fix.
  .refine((values) => values.status !== "published" || values.officialUrl !== null, {
    message: "A published grant needs an official URL. Save it as a draft instead.",
    path: ["officialUrl"],
  })
  .refine((values) => values.status !== "published" || values.categoryIds.length > 0, {
    message: "A published grant needs at least one category.",
    path: ["categoryIds"],
  });

export type GrantCreateInput = z.input<typeof grantCreateSchema>;
export type GrantCreateValues = z.output<typeof grantCreateSchema>;

/** Country, agency, state, categories and funding level on an existing grant. */
export const grantClassificationSchema = z
  .object({
    grantId: z.string().uuid(),
    countryId: z.string().uuid("Choose a country."),

    // Same either/or as creation. Moving a grant to a country that has no
    // agencies recorded is otherwise impossible, and that is every country
    // except the United States until someone adds the first one.
    organizationId: z.string().uuid().nullable().optional(),
    newOrganizationName: z.string().trim().max(200).optional(),
    newOrganizationWebsite: optionalUrl.optional(),

    stateId: z.string().uuid().nullable().optional(),
    categoryIds: z.array(z.string().uuid()).default([]),
    primaryCategoryId: z.string().uuid().nullable().optional(),
    fundingLevel: z.enum(FUNDING_LEVELS).default("national"),
    changeReason: z.string().trim().max(300).optional(),
  })
  .refine(
    (values) =>
      (values.organizationId ?? null) !== null ||
      (values.newOrganizationName ?? "").trim() !== "",
    {
      message: "Choose an existing agency or enter a new one.",
      path: ["organizationId"],
    },
  );

export type GrantClassificationInput = z.input<typeof grantClassificationSchema>;
export type GrantClassificationValues = z.output<typeof grantClassificationSchema>;
