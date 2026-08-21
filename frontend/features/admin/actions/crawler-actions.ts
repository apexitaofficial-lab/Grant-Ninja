"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { routes } from "@/config/routes";
import { crawlerRepository } from "@/features/admin/repositories/crawler-repository";
import { requestCrawlSchema } from "@/features/admin/schemas/request-crawl-schema";
import { requireAdmin } from "@/features/admin/services/auth-service";
import type { ActionResult } from "@/lib/errors";
import { failure, success, toActionFailure } from "@/lib/errors";
import { logger } from "@/lib/logger";

export interface RequestCrawlResult {
  readonly runId: string | null;
  readonly message: string;
}

/**
 * Queues a crawl of one source.
 *
 * This only *asks*. The Python worker picks the job up, which is why the reply
 * says "queued" rather than "crawling" — claiming the crawl had started when
 * no worker is running would be a lie the page cannot detect.
 */
const setSourceStatusSchema = z.object({
  sourceId: z.string().uuid(),
  status: z.enum(["active", "inactive"]),
});

/**
 * Switches a source on or off.
 *
 * Activating is refused when no adapter is registered for the source, because
 * the scheduler would then queue jobs the worker can only fail. That check is
 * here rather than only in the UI: the button can be disabled, but an action
 * must not trust that it was.
 *
 * Deactivating is always allowed — pausing a source that has started blocking
 * the crawler, or that is producing noise, has to work immediately and
 * unconditionally.
 */
export async function setSourceStatus(
  input: unknown,
): Promise<ActionResult<{ status: string; message: string }>> {
  const admin = await requireAdmin("admin");
  const parsed = setSourceStatusSchema.safeParse(input);

  if (!parsed.success) {
    return failure("VALIDATION_FAILED", "Could not read that request.");
  }

  try {
    if (parsed.data.status === "active") {
      const sources = await crawlerRepository.listSources();
      const source = sources.find((candidate) => candidate.id === parsed.data.sourceId);

      if (source === undefined) {
        return failure("NOT_FOUND", "That source no longer exists.");
      }

      const registered = await crawlerRepository.listRegisteredAdapterKeys();

      // An empty list means the worker has never run, so the answer is
      // unknown rather than no. Refusing on unknown would make the toggle
      // unusable on a fresh install.
      if (registered.length > 0 && !registered.includes(source.adapterKey)) {
        return failure(
          "VALIDATION_FAILED",
          `No adapter named "${source.adapterKey}" is registered, so this source would queue crawls that fail. Write the adapter first.`,
        );
      }
    }

    await crawlerRepository.setSourceStatus(parsed.data.sourceId, parsed.data.status);

    logger.info("Crawler source status changed", {
      feature: "admin",
      action: "setSourceStatus",
      userId: admin.id,
      sourceId: parsed.data.sourceId,
      status: parsed.data.status,
    });

    revalidatePath(routes.admin.crawler);

    return success({
      status: parsed.data.status,
      message:
        parsed.data.status === "active"
          ? "Source activated. It will be picked up on its next scheduled slot."
          : "Source paused. Scheduled crawls will skip it until it is switched back on.",
    });
  } catch (error) {
    return toActionFailure(error, { feature: "admin", action: "setSourceStatus" });
  }
}

export async function requestCrawl(input: unknown): Promise<ActionResult<RequestCrawlResult>> {
  // Editor is the floor: running a crawl spends money on AI calls and changes
  // published data, so it is not a viewer's button.
  const admin = await requireAdmin("editor");

  const parsed = requestCrawlSchema.safeParse(input);

  if (!parsed.success) {
    return failure("VALIDATION_FAILED", parsed.error.issues[0]?.message ?? "Check the details.");
  }

  try {
    const runId = await crawlerRepository.requestCrawl(
      parsed.data.sourceId,
      parsed.data.pageLimit,
      admin.id,
    );

    if (runId === null) {
      // Not an error. The database refused a second job for a source that
      // already has one, which is exactly what should happen when someone
      // presses the button twice.
      return success({
        runId: null,
        message: "That source is already queued or running.",
      });
    }

    logger.info("Crawl requested", {
      feature: "admin",
      action: "requestCrawl",
      userId: admin.id,
      runId,
      pageLimit: parsed.data.pageLimit,
    });

    revalidatePath(routes.admin.crawler);

    return success({
      runId,
      message: `Queued ${parsed.data.pageLimit} pages. The worker will pick it up shortly.`,
    });
  } catch (error) {
    return toActionFailure(error, { feature: "admin", action: "requestCrawl" });
  }
}
