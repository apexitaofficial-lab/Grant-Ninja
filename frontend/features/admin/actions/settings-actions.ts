"use server";

import { revalidatePath } from "next/cache";

import { routes } from "@/config/routes";
import { settingsAdminRepository } from "@/features/admin/repositories/settings-admin-repository";
import {
  coerceGroup,
  saveSettingsSchema,
  socialProfileSchema,
} from "@/features/admin/schemas/settings-schema";
import { requireAdmin } from "@/features/admin/services/auth-service";
import type { ActionResult } from "@/lib/errors";
import { failure, success, toActionFailure } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { stripTrackingParams } from "@/lib/url";

/**
 * Settings feed the header, footer, metadata, robots.txt, llms.txt and the
 * JSON-LD on every page, so a change has to invalidate the whole tree rather
 * than one route. `"layout"` is what makes the footer and metadata update
 * too — revalidating only the settings page would show the new value in the
 * form and nowhere else.
 */
function revalidateSite(): void {
  revalidatePath("/", "layout");
  revalidatePath(routes.admin.settings);
}

export async function saveSettings(input: unknown): Promise<ActionResult<{ saved: number }>> {
  const admin = await requireAdmin("admin");
  const parsed = saveSettingsSchema.safeParse(input);

  if (!parsed.success) {
    return failure("VALIDATION_FAILED", "Could not read the submitted settings.");
  }

  const coerced = coerceGroup(parsed.data.values);

  if (!coerced.ok) {
    return failure("VALIDATION_FAILED", coerced.error);
  }

  if (coerced.map.size === 0) {
    return failure("VALIDATION_FAILED", "Nothing recognisable to save.");
  }

  try {
    await settingsAdminRepository.updateValues(coerced.map);

    logger.info("Settings updated", {
      feature: "admin",
      action: "saveSettings",
      userId: admin.id,
      group: parsed.data.groupId,
      keys: [...coerced.map.keys()].join(","),
    });

    revalidateSite();

    return success({ saved: coerced.map.size });
  } catch (error) {
    return toActionFailure(error, { feature: "admin", action: "saveSettings" });
  }
}

export async function saveSocialProfile(
  input: unknown,
): Promise<ActionResult<{ url: string; cleaned: boolean }>> {
  const admin = await requireAdmin("admin");
  const parsed = socialProfileSchema.safeParse(input);

  if (!parsed.success) {
    return failure("VALIDATION_FAILED", parsed.error.issues[0]?.message ?? "Check the profile.");
  }

  // Tracking parameters are stripped before storage, per the agreed rule: a
  // sameAs entry carrying ?utm_source weakens the entity match a search engine
  // makes between the profile and the organisation, and leaks referral data
  // into the page source. Doing it here rather than in the form means a value
  // pasted from anywhere is cleaned, including one sent straight to the action.
  const cleanedUrl = stripTrackingParams(parsed.data.url);

  if (cleanedUrl === null) {
    return failure("VALIDATION_FAILED", "That is not a valid http or https URL.");
  }

  try {
    await settingsAdminRepository.updateSocialProfile(parsed.data.id, {
      url: cleanedUrl,
      isPrimary: parsed.data.isPrimary,
      enabled: parsed.data.enabled,
    });

    logger.info("Social profile updated", {
      feature: "admin",
      action: "saveSocialProfile",
      userId: admin.id,
      profileId: parsed.data.id,
    });

    revalidateSite();

    return success({ url: cleanedUrl, cleaned: cleanedUrl !== parsed.data.url.trim() });
  } catch (error) {
    return toActionFailure(error, { feature: "admin", action: "saveSocialProfile" });
  }
}
