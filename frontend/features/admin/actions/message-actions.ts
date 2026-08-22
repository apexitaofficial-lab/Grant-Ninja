"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { routes } from "@/config/routes";
import { messageAdminRepository } from "@/features/admin/repositories/message-admin-repository";
import { requireAdmin } from "@/features/admin/services/auth-service";
import type { ActionResult } from "@/lib/errors";
import { failure, success, toActionFailure } from "@/lib/errors";
import { logger } from "@/lib/logger";

const setStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "read", "replied", "archived"]),
});

export async function setMessageStatus(input: unknown): Promise<ActionResult<{ status: string }>> {
  const admin = await requireAdmin("editor");
  const parsed = setStatusSchema.safeParse(input);

  if (!parsed.success) {
    return failure("VALIDATION_FAILED", "Could not read that request.");
  }

  try {
    await messageAdminRepository.setStatus(parsed.data.id, parsed.data.status);

    logger.info("Message status changed", {
      feature: "admin",
      action: "setMessageStatus",
      userId: admin.id,
      messageId: parsed.data.id,
      status: parsed.data.status,
    });

    revalidatePath(routes.admin.messages);
    // The dashboard's unread counter reads the same table.
    revalidatePath(routes.admin.root);

    return success({ status: parsed.data.status });
  } catch (error) {
    return toActionFailure(error, { feature: "admin", action: "setMessageStatus" });
  }
}
