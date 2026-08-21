import type { Metadata } from "next";

import { SettingsGroupForm } from "@/features/admin/components/settings-group-form";
import { SocialProfilesEditor } from "@/features/admin/components/social-profiles-editor";
import { SETTING_GROUPS } from "@/features/admin/config/settings-fields";
import { settingsAdminRepository } from "@/features/admin/repositories/settings-admin-repository";
import { settingValueToInput } from "@/features/admin/schemas/settings-schema";
import { requireAdmin } from "@/features/admin/services/auth-service";

export const metadata: Metadata = { title: "Settings" };

/**
 * Site Settings — MASTER_PROJECT_SPEC.md Part 5A §24, decision D8.
 *
 * The point of this page is that nothing it covers is hardcoded anywhere else.
 * Values are read through the settings service and cached per request, so a
 * change here reaches the header, footer, metadata, robots.txt, llms.txt and
 * the JSON-LD on every page without a deploy.
 */
export default async function AdminSettingsPage() {
  await requireAdmin("admin");

  const [settings, profiles] = await Promise.all([
    settingsAdminRepository.listAll(),
    settingsAdminRepository.listSocialProfiles(),
  ]);

  const byKey = new Map(settings.map((row) => [row.key, row.value]));
  const primaryCount = profiles.filter((profile) => profile.isPrimary && profile.enabled).length;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Everything here is read from the database at request time. Changing a value takes effect
          on the next page load — no deploy, no code change.
        </p>
      </div>

      {SETTING_GROUPS.map((group) => (
        <div key={group.id} className="border-t border-border pt-8 first:border-0 first:pt-0">
          <SettingsGroupForm
            group={group}
            values={Object.fromEntries(
              group.fields.map((field) => [
                field.key,
                settingValueToInput(byKey.get(field.key) ?? null),
              ]),
            )}
          />
        </div>
      ))}

      <div className="border-t border-border pt-8">
        <div>
          <h2 className="text-base font-semibold">Social profiles</h2>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
            <strong>In sameAs</strong> puts a profile in the Organization structured data, which is
            how a search engine ties these accounts to the organisation. Only high-authority
            profiles belong there — a long list of directories dilutes the signal rather than
            strengthening it. <strong>Shown</strong> controls the footer independently, so a profile
            can be linked without being claimed as an identity.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {primaryCount} profile{primaryCount === 1 ? "" : "s"} currently emitted in{" "}
            <code className="font-mono">sameAs</code>.
          </p>
        </div>

        <div className="mt-5">
          <SocialProfilesEditor profiles={profiles} />
        </div>
      </div>
    </div>
  );
}
