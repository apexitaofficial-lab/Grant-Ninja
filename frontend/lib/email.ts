import "server-only";

import { Resend } from "resend";

import { getServerEnv } from "@/config/env";
import { logger } from "@/lib/logger";

/**
 * Outgoing email, via Resend.
 *
 * Two rules shape everything here.
 *
 * **Email is a notification, never the record.** Anything worth emailing is
 * written to the database first. So a send that fails is logged and swallowed —
 * it must not turn a successfully received message into an error the visitor
 * sees, because the message *was* received.
 *
 * **Not configuring it is a valid state.** With no API key the site runs
 * normally and sends nothing. That keeps local development working without a
 * Resend account, and means a missing key degrades to "nobody was notified"
 * rather than "the contact form is broken".
 */

export interface SendEmailOptions {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  /** Set so a reply goes to the person who wrote in, not to the sending domain. */
  readonly replyTo?: string;
}

export type SendResult =
  | { readonly status: "sent"; readonly id: string }
  | { readonly status: "skipped"; readonly reason: string }
  | { readonly status: "failed"; readonly reason: string };

let client: Resend | null = null;

function getClient(apiKey: string): Resend {
  client ??= new Resend(apiKey);

  return client;
}

export async function sendEmail(options: SendEmailOptions): Promise<SendResult> {
  const env = getServerEnv();

  if (env.RESEND_API_KEY === undefined || env.RESEND_FROM_EMAIL === undefined) {
    const reason = "RESEND_API_KEY or RESEND_FROM_EMAIL is not set";

    logger.warn("Email not sent — provider is not configured", {
      feature: "email",
      action: "sendEmail",
      subject: options.subject,
      reason,
    });

    return { status: "skipped", reason };
  }

  try {
    const { data, error } = await getClient(env.RESEND_API_KEY).emails.send({
      from: env.RESEND_FROM_EMAIL,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      ...(options.replyTo === undefined ? {} : { replyTo: options.replyTo }),
    });

    if (error !== null) {
      // Resend reports failures in the body rather than by throwing, so this
      // branch is the common one — a wrong key or an unverified sending domain
      // both land here.
      logger.error("Resend rejected the message", error, {
        feature: "email",
        action: "sendEmail",
        subject: options.subject,
      });

      return { status: "failed", reason: error.message };
    }

    logger.info("Email sent", {
      feature: "email",
      action: "sendEmail",
      subject: options.subject,
      messageId: data?.id,
    });

    return { status: "sent", id: data?.id ?? "" };
  } catch (error) {
    logger.error("Email provider unreachable", error, {
      feature: "email",
      action: "sendEmail",
      subject: options.subject,
    });

    return { status: "failed", reason: "provider unreachable" };
  }
}

/**
 * Escapes text before it is placed in an HTML email.
 *
 * Contact form content is written by strangers and rendered by a mail client.
 * An unescaped angle bracket is at best a mangled message and at worst script
 * in someone's inbox.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
