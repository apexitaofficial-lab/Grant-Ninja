"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { routes } from "@/config/routes";
import { duplicateAdminRepository } from "@/features/admin/repositories/duplicate-admin-repository";
import { requireAdmin } from "@/features/admin/services/auth-service";
import type { ActionResult } from "@/lib/errors";
import { failure, success, toActionFailure } from "@/lib/errors";
import { logger } from "@/lib/logger";

const resolveSchema = z
  .object({
    id: z.string().uuid(),
    decision: z.enum(["duplicate", "different"]),
    keepGrantId: z.string().uuid().nullable().optional(),
    reason: z.string().trim().max(300).optional(),
  })
  .refine(
    (values) => values.decision !== "duplicate" || Boolean(values.keepGrantId),
    // Merging without saying which record survives would leave the choice to
    // the database, and it has no basis for one.
    { message: "Choose which record to keep.", path: ["keepGrantId"] },
  );

export async function resolveDuplicate(
  input: unknown,
): Promise<ActionResult<{ id: string; decision: string }>> {
  const admin = await requireAdmin("editor");
  const parsed = resolveSchema.safeParse(input);

  if (!parsed.success) {
    return failure("VALIDATION_FAILED", parsed.error.issues[0]?.message ?? "Check the decision.");
  }

  try {
    await duplicateAdminRepository.resolve(
      parsed.data.id,
      parsed.data.decision,
      parsed.data.keepGrantId ?? null,
      parsed.data.reason ??
        (parsed.data.decision === "duplicate"
          ? "merged in the duplicate queue"
          : "confirmed as separate grants"),
    );

    logger.info("Duplicate resolved", {
      feature: "admin",
      action: "resolveDuplicate",
      userId: admin.id,
      pairId: parsed.data.id,
      decision: parsed.data.decision,
    });

    revalidatePath(routes.admin.duplicates);
    revalidatePath(routes.admin.grants);
    // Archiving a grant removes it from the public site.
    revalidatePath("/", "layout");

    return success({ id: parsed.data.id, decision: parsed.data.decision });
  } catch (error) {
    return toActionFailure(error, { feature: "admin", action: "resolveDuplicate" });
  }
}
