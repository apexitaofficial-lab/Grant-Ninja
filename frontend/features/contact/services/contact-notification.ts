import "server-only";

import { getServerEnv } from "@/config/env";
import type { ContactMessageInput } from "@/features/contact/schemas/contact-schema";
import { getSiteIdentity } from "@/features/shared/services/settings-service";
import type { SendResult } from "@/lib/email";
import { escapeHtml, sendEmail } from "@/lib/email";

/**
 * The two emails a contact submission produces.
 *
 * **To the sender** — an acknowledgement, so a stranger who has just written to
 * a company they do not know gets an immediate signal that it arrived. Without
 * it the only feedback is a line of text on a page they are about to close.
 *
 * **To the team** — the lead itself, so someone acts on it. The message is
 * already in the database by the time these run; both emails are notifications,
 * not the record, and neither is allowed to fail the submission.
 *
 * They are sent independently. A bounced acknowledgement (a mistyped address —
 * common) must not stop the team hearing about the lead, and a team mailbox
 * problem must not stop the sender being thanked.
 */

const BRAND_NAVY = "#104577";
const BRAND_EMERALD = "#0f9d76";
const INK = "#16233a";
const MUTED = "#5b6b7f";
const HAIRLINE = "#e2e8f0";
const GROUND = "#f6f8fb";
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function detailRow(label: string, value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    return "";
  }

  return `<tr>
      <td style="padding:6px 16px 6px 0;color:${MUTED};font:400 13px/1.5 ${SANS};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:6px 0;color:${INK};font:500 14px/1.5 ${SANS};">${escapeHtml(value)}</td>
    </tr>`;
}

function textRow(label: string, value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    return "";
  }

  return `${label}: ${value}\n`;
}

/** Shared frame. Tables and inline styles, because mail clients ignore most CSS. */
function shell(heading: string, accent: string, body: string, footer: string): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <!-- The MIME header declares UTF-8 too, but not every mail client reads it
         before deciding how to decode the body. Without this an em dash or an
         accented name arrives as mojibake. -->
  </head>
  <body style="margin:0;padding:24px;background:${GROUND};">
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${HAIRLINE};border-radius:4px;">
      <tr>
        <td style="padding:20px 24px;border-bottom:1px solid ${HAIRLINE};">
          <p style="margin:0;color:${accent};font:600 15px/1.4 ${SANS};">${escapeHtml(heading)}</p>
        </td>
      </tr>
      ${body}
      <tr>
        <td style="padding:14px 24px;border-top:1px solid ${HAIRLINE};">
          <p style="margin:0;color:#7a8ba0;font:400 12px/1.5 ${SANS};">${footer}</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export interface EmailContent {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

/**
 * Acknowledgement to the person who wrote in.
 *
 * Deliberately plain. An auto-reply that reads like marketing gets filed as
 * marketing, and this one needs to reach an inbox — it is the only proof the
 * sender has that their message landed. It also quotes their message back so
 * they have a copy of what they actually sent.
 *
 * Built separately from sending so it can be previewed and tested without a
 * mail provider. A template only ever seen in production is a template whose
 * bugs are found by customers.
 */
export function buildAcknowledgement(
  message: ContactMessageInput,
  siteName: string,
  siteUrl: string,
): EmailContent {
  const body = `
      <tr>
        <td style="padding:20px 24px 8px;">
          <p style="margin:0 0 14px;color:${INK};font:400 15px/1.65 ${SANS};">Hi ${escapeHtml(message.name)},</p>
          <p style="margin:0 0 14px;color:${INK};font:400 15px/1.65 ${SANS};">
            Thank you for getting in touch with ${escapeHtml(siteName)}. Your message has reached
            us and a member of the team will reply, usually within one business day.
          </p>
          <p style="margin:0;color:${INK};font:400 15px/1.65 ${SANS};">
            There is nothing you need to do in the meantime. If anything changes or you want to add
            detail, simply reply to this email.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 24px 24px;">
          <p style="margin:0 0 8px;color:${MUTED};font:400 12px/1.5 ${SANS};text-transform:uppercase;letter-spacing:0.08em;">
            What you sent
          </p>
          <div style="padding:14px 16px;background:${GROUND};border-left:2px solid ${BRAND_EMERALD};color:${INK};font:400 14px/1.6 ${SANS};white-space:pre-wrap;">${escapeHtml(message.message)}</div>
        </td>
      </tr>`;

  const text =
    `Hi ${message.name},\n\n` +
    `Thank you for getting in touch with ${siteName}. Your message has reached us and a member ` +
    `of the team will reply, usually within one business day.\n\n` +
    `There is nothing you need to do in the meantime. If anything changes or you want to add ` +
    `detail, simply reply to this email.\n\n` +
    `--- What you sent ---\n${message.message}\n\n` +
    `${siteName}\n`;

  return {
    subject: `We received your message — ${siteName}`,
    html: shell(
      `Thanks for contacting ${escapeHtml(siteName)}`,
      BRAND_NAVY,
      body,
      `You are receiving this because you used the contact form on ${escapeHtml(siteUrl)}.`,
    ),
    text,
  };
}

/** The lead itself, to whoever answers enquiries. */
export function buildTeamNotification(message: ContactMessageInput): EmailContent {
  const body = `
      <tr>
        <td style="padding:20px 24px;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
            ${detailRow("From", message.name)}
            ${detailRow("Email", message.email)}
            ${detailRow("Company", message.company)}
            ${detailRow("Phone", message.phone)}
            ${detailRow("Subject", message.subject)}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:0 24px 24px;">
          <p style="margin:0 0 8px;color:${MUTED};font:400 12px/1.5 ${SANS};text-transform:uppercase;letter-spacing:0.08em;">
            Message
          </p>
          <div style="padding:14px 16px;background:${GROUND};border-left:2px solid ${BRAND_EMERALD};color:${INK};font:400 14px/1.6 ${SANS};white-space:pre-wrap;">${escapeHtml(message.message)}</div>
        </td>
      </tr>`;

  const text =
    `New enquiry from the contact form\n\n` +
    textRow("From", message.name) +
    textRow("Email", message.email) +
    textRow("Company", message.company) +
    textRow("Phone", message.phone) +
    textRow("Subject", message.subject) +
    `\nMessage:\n${message.message}\n\n` +
    `Reply to this email to answer ${message.name} directly. ` +
    `They have already been sent an acknowledgement.\n`;

  return {
    // The sender's own subject goes in the body, never here — a stranger
    // controls that text, and a subject line is where it could be shaped to
    // look like a system notice.
    subject: `New enquiry — ${message.name}`,
    html: shell(
      "New enquiry from the contact form",
      BRAND_NAVY,
      body,
      `Reply to this email to answer ${escapeHtml(message.name)} directly. They have already been sent an acknowledgement.`,
    ),
    text,
  };
}

export interface ContactNotificationOutcome {
  readonly acknowledgement: SendResult;
  readonly teamNotification: SendResult;
}

export async function notifyContactMessage(
  message: ContactMessageInput,
): Promise<ContactNotificationOutcome> {
  const recipient = getServerEnv().CONTACT_NOTIFICATION_EMAIL;
  const identity = await getSiteIdentity();

  const ack = buildAcknowledgement(message, identity.name, identity.url);
  const lead = buildTeamNotification(message);

  // Sent together, settled independently. A mistyped sender address is the
  // most common failure here, and it must not cost the team the lead.
  const [acknowledgement, teamNotification] = await Promise.all([
    sendEmail({ to: message.email, ...ack }),
    recipient === undefined
      ? Promise.resolve<SendResult>({
          status: "skipped",
          reason: "CONTACT_NOTIFICATION_EMAIL is not set",
        })
      : sendEmail({ to: recipient, ...lead, replyTo: message.email }),
  ]);

  return { acknowledgement, teamNotification };
}
