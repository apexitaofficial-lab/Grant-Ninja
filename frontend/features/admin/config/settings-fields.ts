/**
 * What the Settings page can edit, described once.
 *
 * The form, the validation and the save path are all generated from this list,
 * so adding a setting means adding one entry rather than editing three files
 * that can drift apart. It mirrors `types/site-settings.ts`, which is the
 * contract the database and the page were both built from.
 *
 * Keys not listed here are deliberately not editable. `gemini_model` and the
 * crawler user agent are here because an operator genuinely needs them when a
 * model is deprecated or a site starts blocking the bot — both have happened
 * already.
 */

export type SettingKind =
  "text" | "textarea" | "url" | "email" | "tel" | "color" | "boolean" | "number" | "string-list";

export interface SettingField {
  readonly key: string;
  readonly label: string;
  readonly kind: SettingKind;
  readonly help?: string;
  /** Numbers only. */
  readonly min?: number;
  readonly max?: number;
  /** Rendered but not saved — the value comes from the environment. */
  readonly readOnly?: boolean;
}

export interface SettingGroup {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  /** Lowest role that may edit this group. */
  readonly minimumRole: "admin" | "super_admin";
  readonly fields: readonly SettingField[];
}

export const SETTING_GROUPS: readonly SettingGroup[] = [
  {
    id: "branding",
    title: "Branding",
    description: "Name and marks used across the site, its metadata and its structured data.",
    minimumRole: "admin",
    fields: [
      {
        key: "site_name",
        label: "Site name",
        kind: "text",
        help: "Used in the header, the footer, page titles and Organization structured data.",
      },
      {
        key: "logo_url",
        label: "Logo URL",
        kind: "text",
        help: "A path such as /logo-wordmark.png, or a full URL to hosted storage.",
      },
      { key: "favicon_url", label: "Favicon URL", kind: "text" },
      {
        key: "primary_color",
        label: "Primary colour",
        kind: "color",
        help: "Brand navy, sampled from the logo. Hex or oklch.",
      },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    description:
      "Published on the site and emitted in Organization structured data. Search engines treat a consistent address as an entity signal, so leaving these empty costs more than it looks.",
    minimumRole: "admin",
    fields: [
      { key: "contact_email", label: "Public email", kind: "email" },
      { key: "contact_phone", label: "Public telephone", kind: "tel" },
      {
        key: "zendesk_widget_key",
        label: "Zendesk widget key",
        kind: "text",
        help: "Loads the support chat bubble on every public page. Clearing this removes the widget from the site — no deploy needed.",
      },
    ],
  },
  {
    id: "seo",
    title: "SEO and LLMO",
    description: "Defaults for pages that do not set their own, and the rules crawlers follow.",
    minimumRole: "admin",
    fields: [
      { key: "default_meta_title", label: "Default meta title", kind: "text" },
      {
        key: "default_meta_description",
        label: "Default meta description",
        kind: "textarea",
        help: "Around 155 characters is what most engines display.",
      },
      {
        key: "default_og_image_url",
        label: "Default OpenGraph image",
        kind: "text",
        help: "Shown when a page is shared and has no image of its own. 1200×630 works everywhere.",
      },
      {
        key: "robots_allow_indexing",
        label: "Allow search engines to index the site",
        kind: "boolean",
        help: "Switching this off serves Disallow: / to every crawler. Use it for a staging deployment, never for a live one.",
      },
      {
        key: "robots_disallow_paths",
        label: "Disallowed paths",
        kind: "string-list",
        help: "One path per line. /admin should always be here.",
      },
      {
        key: "llms_txt",
        label: "llms.txt body",
        kind: "textarea",
        help: "Leave empty to serve the generated version, which stays current with live counts. Anything here replaces it wholesale.",
      },
    ],
  },
  {
    id: "ai",
    title: "AI pipeline",
    description:
      "Read by the Python pipeline at the start of every run, so a change here takes effect on the next crawl without a deploy.",
    minimumRole: "admin",
    fields: [
      {
        key: "auto_publish_confidence_threshold",
        label: "Auto-publish confidence threshold",
        kind: "number",
        min: 0,
        max: 100,
        help: "Extractions at or above this publish automatically. Anything below waits in the review queue. Lowering it publishes more and reviews less.",
      },
      {
        key: "gemini_model",
        label: "Gemini model",
        kind: "text",
        help: "Change this when a model is deprecated — that has already happened once.",
      },
      {
        key: "fallback_category_slug",
        label: "Fallback category",
        kind: "text",
        help: "Assigned when nothing else matches, so a grant is never blocked from publication by classification alone. Empty disables the fallback and sends unmatched grants to review.",
      },
    ],
  },
  {
    id: "crawler",
    title: "Crawler",
    description: "Defaults for sources that do not override them.",
    minimumRole: "admin",
    fields: [
      {
        key: "crawler_user_agent",
        label: "User agent",
        kind: "text",
        help: "Identifies the bot to the sites it visits. Keep the contact URL in it — it is what a site owner uses instead of blocking you.",
      },
      {
        key: "crawler_default_request_delay_ms",
        label: "Default delay between requests (ms)",
        kind: "number",
        min: 0,
        max: 60000,
        help: "A site's own robots.txt Crawl-delay wins when it asks for longer.",
      },
    ],
  },
  {
    id: "analytics",
    title: "Analytics",
    description: "Left empty until the tags are needed; nothing is loaded while they are blank.",
    minimumRole: "admin",
    fields: [
      { key: "google_analytics_id", label: "Google Analytics ID", kind: "text" },
      {
        key: "google_site_verification",
        label: "Search Console verification",
        kind: "text",
        help: "The content value from the verification meta tag, not the whole tag.",
      },
    ],
  },
];

export const EDITABLE_KEYS: readonly string[] = SETTING_GROUPS.flatMap((group) =>
  group.fields.filter((field) => field.readOnly !== true).map((field) => field.key),
);

export function findField(key: string): SettingField | undefined {
  for (const group of SETTING_GROUPS) {
    const field = group.fields.find((candidate) => candidate.key === key);

    if (field !== undefined) {
      return field;
    }
  }

  return undefined;
}
