import "server-only";

import type { FaqEntityType, FaqItem } from "@/features/shared/repositories/faq-repository";
import { faqRepository } from "@/features/shared/repositories/faq-repository";
import { logger } from "@/lib/logger";

/**
 * FAQs are supporting content wherever they appear, so a failure degrades to
 * no section rather than taking down the page around it. The error is still
 * logged — swallowed for the reader, not for us.
 */

/** FAQs attached to a database row. Callers already hold the entity's id. */
export async function getEntityFaqs(
  entityType: Extract<FaqEntityType, "country" | "state" | "category" | "organization">,
  entityId: string,
): Promise<readonly FaqItem[]> {
  try {
    return await faqRepository.listFor(entityType, entityId);
  } catch (error) {
    logger.error("FAQs unavailable", error, {
      feature: "shared",
      action: "getEntityFaqs",
      entityType,
      entityId,
    });

    return [];
  }
}

/** FAQs attached to a static marketing page rather than a database row. */
export async function getStaticPageFaqs(
  page: Extract<FaqEntityType, "home" | "about" | "contact" | "service">,
): Promise<readonly FaqItem[]> {
  try {
    return await faqRepository.listFor(page, null);
  } catch (error) {
    logger.error("FAQs unavailable", error, {
      feature: "shared",
      action: "getStaticPageFaqs",
      page,
    });

    return [];
  }
}
