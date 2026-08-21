"use server";

import { revalidatePath } from "next/cache";

import { routes } from "@/config/routes";
import type { ReferenceEntity } from "@/features/admin/repositories/reference-admin-repository";
import { referenceAdminRepository } from "@/features/admin/repositories/reference-admin-repository";
import {
  agencyEditSchema,
  categoryEditSchema,
  countryEditSchema,
} from "@/features/admin/schemas/reference-schema";
import { requireAdmin } from "@/features/admin/services/auth-service";
import type { ActionResult } from "@/lib/errors";
import { failure, success, toActionFailure } from "@/lib/errors";
import { logger } from "@/lib/logger";

export interface ReferenceSaveResult {
  readonly id: string;
  /** The old path now 301-ing to the new one, when the slug changed. */
  readonly redirectFrom: string | null;
}

/**
 * The public path for an entity, from `config/routes.ts`.
 *
 * The database function takes these as arguments rather than building them,
 * so the URL shape stays defined in exactly one place. A second copy in SQL
 * would be wrong the first time a route changed.
 */
function publicPath(entity: ReferenceEntity, slug: string): string {
  switch (entity) {
    case "country":
      return routes.country(slug);
    case "category":
      return routes.category(slug);
    case "organization":
      return routes.agency(slug);
  }
}

/**
 * Renames the slug when it changed, returning the redirect that was created.
 *
 * Called before the field update: a rename is the operation that can fail on a
 * duplicate slug, and failing before anything else has changed leaves the row
 * exactly as it was.
 */
async function renameIfChanged(
  entity: ReferenceEntity,
  id: string,
  currentSlug: string,
  nextSlug: string,
): Promise<string | null> {
  if (nextSlug === currentSlug) {
    return null;
  }

  return referenceAdminRepository.renameSlug(
    entity,
    id,
    nextSlug,
    publicPath(entity, currentSlug),
    publicPath(entity, nextSlug),
  );
}

function revalidateEverywhere(): void {
  // These feed navigation, filters, sitemaps and structured data across the
  // whole site, so a change is never local to one route.
  revalidatePath("/", "layout");
}

export async function saveCountry(
  input: unknown,
  currentSlug: string,
): Promise<ActionResult<ReferenceSaveResult>> {
  const admin = await requireAdmin("editor");
  const parsed = countryEditSchema.safeParse(input);

  if (!parsed.success) {
    return failure("VALIDATION_FAILED", parsed.error.issues[0]?.message ?? "Check the details.");
  }

  try {
    const redirectFrom = await renameIfChanged(
      "country",
      parsed.data.id,
      currentSlug,
      parsed.data.slug,
    );

    await referenceAdminRepository.updateCountry(parsed.data.id, {
      name: parsed.data.name,
      currency: parsed.data.currency,
      description: parsed.data.description,
      status: parsed.data.status,
    });

    logger.info("Country updated", {
      feature: "admin",
      action: "saveCountry",
      userId: admin.id,
      id: parsed.data.id,
    });

    revalidateEverywhere();

    return success({ id: parsed.data.id, redirectFrom });
  } catch (error) {
    return toActionFailure(error, { feature: "admin", action: "saveCountry" });
  }
}

export async function saveCategory(
  input: unknown,
  currentSlug: string,
): Promise<ActionResult<ReferenceSaveResult>> {
  const admin = await requireAdmin("editor");
  const parsed = categoryEditSchema.safeParse(input);

  if (!parsed.success) {
    return failure("VALIDATION_FAILED", parsed.error.issues[0]?.message ?? "Check the details.");
  }

  try {
    const redirectFrom = await renameIfChanged(
      "category",
      parsed.data.id,
      currentSlug,
      parsed.data.slug,
    );

    await referenceAdminRepository.updateCategory(parsed.data.id, {
      name: parsed.data.name,
      description: parsed.data.description,
      icon: parsed.data.icon,
      sort_order: parsed.data.sortOrder,
      status: parsed.data.status,
    });

    logger.info("Category updated", {
      feature: "admin",
      action: "saveCategory",
      userId: admin.id,
      id: parsed.data.id,
    });

    revalidateEverywhere();

    return success({ id: parsed.data.id, redirectFrom });
  } catch (error) {
    return toActionFailure(error, { feature: "admin", action: "saveCategory" });
  }
}

export async function saveAgency(
  input: unknown,
  currentSlug: string,
): Promise<ActionResult<ReferenceSaveResult>> {
  const admin = await requireAdmin("editor");
  const parsed = agencyEditSchema.safeParse(input);

  if (!parsed.success) {
    return failure("VALIDATION_FAILED", parsed.error.issues[0]?.message ?? "Check the details.");
  }

  try {
    const redirectFrom = await renameIfChanged(
      "organization",
      parsed.data.id,
      currentSlug,
      parsed.data.slug,
    );

    await referenceAdminRepository.updateAgency(parsed.data.id, {
      name: parsed.data.name,
      website: parsed.data.website,
      description: parsed.data.description,
      organization_type: parsed.data.organizationType,
      status: parsed.data.status,
    });

    logger.info("Agency updated", {
      feature: "admin",
      action: "saveAgency",
      userId: admin.id,
      id: parsed.data.id,
    });

    revalidateEverywhere();

    return success({ id: parsed.data.id, redirectFrom });
  } catch (error) {
    return toActionFailure(error, { feature: "admin", action: "saveAgency" });
  }
}
