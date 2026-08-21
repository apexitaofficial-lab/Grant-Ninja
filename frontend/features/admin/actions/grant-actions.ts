"use server";

import { revalidatePath } from "next/cache";

import { routes } from "@/config/routes";
import { grantAdminRepository } from "@/features/admin/repositories/grant-admin-repository";
import { grantEditSchema, grantStatusSchema } from "@/features/admin/schemas/grant-edit-schema";
import { requireAdmin } from "@/features/admin/services/auth-service";
import type { ActionResult } from "@/lib/errors";
import { failure, success, toActionFailure } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Every published change invalidates the public page as well as the admin one.
 * Forgetting the public path is how an operator publishes a grant, reloads the
 * site, and sees nothing.
 */
function revalidateGrant(slug: string): void {
  revalidatePath(routes.admin.grants);
  revalidatePath(routes.grants);
  revalidatePath(routes.grant(slug));
}

export async function saveGrant(input: unknown): Promise<ActionResult<{ grantId: string }>> {
  const admin = await requireAdmin("editor");
  const parsed = grantEditSchema.safeParse(input);

  if (!parsed.success) {
    return failure("VALIDATION_FAILED", parsed.error.issues[0]?.message ?? "Check the details.");
  }

  const { grantId, changeReason, ...values } = parsed.data;

  try {
    const existing = await grantAdminRepository.findById(grantId);

    if (existing === null) {
      return failure("NOT_FOUND", "That grant no longer exists.");
    }

    await grantAdminRepository.save(
      grantId,
      {
        title: values.title,
        short_description: values.shortDescription,
        full_description: values.fullDescription,
        eligibility: values.eligibility,
        minimum_amount: values.minimumAmount,
        maximum_amount: values.maximumAmount,
        official_url: values.officialUrl,
        application_url: values.applicationUrl,
        opens_at: values.opensAt,
        closes_at: values.closesAt,
        ...(values.featured === undefined ? {} : { featured: values.featured }),
      },
      changeReason ?? "edited in admin panel",
    );

    logger.info("Grant edited", {
      feature: "admin",
      action: "saveGrant",
      userId: admin.id,
      grantId,
    });

    revalidateGrant(existing.slug);

    return success({ grantId });
  } catch (error) {
    return toActionFailure(error, { feature: "admin", action: "saveGrant" });
  }
}

export async function setGrantStatus(
  input: unknown,
): Promise<ActionResult<{ grantId: string; status: string }>> {
  const admin = await requireAdmin("editor");
  const parsed = grantStatusSchema.safeParse(input);

  if (!parsed.success) {
    return failure("VALIDATION_FAILED", parsed.error.issues[0]?.message ?? "Check the details.");
  }

  try {
    const existing = await grantAdminRepository.findById(parsed.data.grantId);

    if (existing === null) {
      return failure("NOT_FOUND", "That grant no longer exists.");
    }

    if (parsed.data.status === "published" && existing.categoryNames.length === 0) {
      // The database refuses this too. Catching it here turns a constraint
      // violation into a sentence explaining what to do about it.
      return failure(
        "VALIDATION_FAILED",
        "This grant has no category, so it cannot be published. Assign one first.",
      );
    }

    await grantAdminRepository.setStatus(
      parsed.data.grantId,
      parsed.data.status,
      parsed.data.reason ?? `status changed to ${parsed.data.status}`,
    );

    logger.info("Grant status changed", {
      feature: "admin",
      action: "setGrantStatus",
      userId: admin.id,
      grantId: parsed.data.grantId,
      status: parsed.data.status,
    });

    revalidateGrant(existing.slug);

    return success({ grantId: parsed.data.grantId, status: parsed.data.status });
  } catch (error) {
    return toActionFailure(error, { feature: "admin", action: "setGrantStatus" });
  }
}

export async function deleteGrant(input: unknown): Promise<ActionResult<{ grantId: string }>> {
  // Admin, not editor: this removes a grant from the directory.
  const admin = await requireAdmin("admin");
  const parsed = grantStatusSchema.pick({ grantId: true, reason: true }).safeParse(input);

  if (!parsed.success) {
    return failure("VALIDATION_FAILED", "Could not identify that grant.");
  }

  try {
    const existing = await grantAdminRepository.findById(parsed.data.grantId);

    if (existing === null) {
      return failure("NOT_FOUND", "That grant no longer exists.");
    }

    await grantAdminRepository.softDelete(
      parsed.data.grantId,
      parsed.data.reason ?? "deleted in admin panel",
    );

    logger.info("Grant deleted", {
      feature: "admin",
      action: "deleteGrant",
      userId: admin.id,
      grantId: parsed.data.grantId,
    });

    revalidateGrant(existing.slug);

    return success({ grantId: parsed.data.grantId });
  } catch (error) {
    return toActionFailure(error, { feature: "admin", action: "deleteGrant" });
  }
}
