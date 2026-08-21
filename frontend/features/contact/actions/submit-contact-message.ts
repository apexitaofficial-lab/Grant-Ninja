"use server";

import { headers } from "next/headers";

import { contactRepository } from "@/features/contact/repositories/contact-repository";
import { contactMessageSchema } from "@/features/contact/schemas/contact-schema";
import type { ActionResult } from "@/lib/errors";
import { failure, success, toActionFailure } from "@/lib/errors";
import { logger } from "@/lib/logger";

/**
 * Contact form submission.
 *
 * The Server Action owns validation, rate limiting and logging; the repository
 * only writes. AI_ENGINEERING_GUIDE.md §36.
 */

const RATE_LIMIT_WINDOW_MINUTES = 60;
const RATE_LIMIT_MAX_MESSAGES = 5;

/**
 * `x-forwarded-for` is a client-supplied header and can be spoofed, so this is
 * a spam speed bump rather than a security control. Nginx must be configured
 * to overwrite it with the real peer address for the limit to mean anything.
 */
async function getClientIp(): Promise<string | null> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");

  if (forwarded !== null && forwarded.trim() !== "") {
    // Left-most entry is the original client; the rest are proxies.
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  return headerList.get("x-real-ip");
}

export async function submitContactMessage(input: unknown): Promise<ActionResult<null>> {
  const parsed = contactMessageSchema.safeParse(input);

  if (!parsed.success) {
    // The browser has already shown field errors; this is the untrusted path.
    const first = parsed.error.issues[0];

    return failure("VALIDATION_FAILED", first?.message ?? "Check the form and try again.");
  }

  try {
    const ipAddress = await getClientIp();

    if (ipAddress !== null) {
      const recent = await contactRepository.countRecentFrom(ipAddress, RATE_LIMIT_WINDOW_MINUTES);

      if (recent >= RATE_LIMIT_MAX_MESSAGES) {
        logger.warn("Contact rate limit reached", {
          feature: "contact",
          action: "submitContactMessage",
          ipAddress,
          recent,
        });

        return failure(
          "RATE_LIMITED",
          "You have sent several messages recently. Email us directly if it is urgent.",
        );
      }
    }

    await contactRepository.create(parsed.data, ipAddress);

    logger.info("Contact message received", {
      feature: "contact",
      action: "submitContactMessage",
    });

    return success(null);
  } catch (error) {
    return toActionFailure(error, { feature: "contact", action: "submitContactMessage" });
  }
}
