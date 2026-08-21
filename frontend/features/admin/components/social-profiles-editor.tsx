"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { saveSocialProfile } from "@/features/admin/actions/settings-actions";
import type { AdminSocialProfile } from "@/features/admin/repositories/settings-admin-repository";

interface SocialProfilesEditorProps {
  readonly profiles: readonly AdminSocialProfile[];
}

/**
 * The `sameAs` list.
 *
 * Two things here are not cosmetic. Only *primary* profiles are emitted in
 * Organization JSON-LD (decision D7) — a long list of low-authority
 * directories dilutes the entity signal rather than strengthening it, so the
 * split is the point of the checkbox. And URLs are cleaned of tracking
 * parameters on save, which is why a pasted link may come back shorter than
 * it went in.
 */
export function SocialProfilesEditor({ profiles }: SocialProfilesEditorProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="hidden gap-3 border-b border-border pb-2 lg:grid lg:grid-cols-[9rem_1fr_5rem_4rem_5rem]">
        <ColumnLabel>Platform</ColumnLabel>
        <ColumnLabel>URL</ColumnLabel>
        <ColumnLabel>In sameAs</ColumnLabel>
        <ColumnLabel>Shown</ColumnLabel>
        <span />
      </div>

      {profiles.map((profile) => (
        <ProfileRow key={profile.id} profile={profile} />
      ))}
    </div>
  );
}

function ProfileRow({ profile }: { readonly profile: AdminSocialProfile }) {
  const router = useRouter();
  const [url, setUrl] = useState(profile.url);
  const [isPrimary, setIsPrimary] = useState(profile.isPrimary);
  const [enabled, setEnabled] = useState(profile.enabled);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    url !== profile.url || isPrimary !== profile.isPrimary || enabled !== profile.enabled;

  async function onSave() {
    setBusy(true);
    setError(null);
    setNote(null);

    try {
      const result = await saveSocialProfile({ id: profile.id, url, isPrimary, enabled });

      if (!result.ok) {
        setError(result.message);

        return;
      }

      if (result.data.cleaned) {
        // Worth saying out loud: the stored value differs from what was typed,
        // and silently changing someone's input is how you get a bug report.
        setUrl(result.data.url);
        setNote("Tracking parameters removed.");
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 border-b border-border py-3 last:border-0 lg:grid lg:grid-cols-[9rem_1fr_5rem_4rem_5rem] lg:items-center lg:gap-3">
      <span className="font-mono text-xs">{profile.platform}</span>

      <Input
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        aria-label={`${profile.label} URL`}
        className="font-mono text-xs"
      />

      <label className="flex items-center gap-2 text-xs lg:justify-center">
        <Checkbox
          checked={isPrimary}
          onCheckedChange={(checked) => setIsPrimary(checked === true)}
          aria-label={`Include ${profile.label} in sameAs`}
        />
        <span className="lg:hidden">In sameAs</span>
      </label>

      <label className="flex items-center gap-2 text-xs lg:justify-center">
        <Checkbox
          checked={enabled}
          onCheckedChange={(checked) => setEnabled(checked === true)}
          aria-label={`Show ${profile.label} in the footer`}
        />
        <span className="lg:hidden">Shown in footer</span>
      </label>

      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onSave}
        disabled={busy || !isDirty}
      >
        {busy ? "…" : "Save"}
      </Button>

      {(note !== null || error !== null) && (
        <p
          role="status"
          className={`text-xs lg:col-span-5 ${error === null ? "text-muted-foreground" : "font-medium text-destructive"}`}
        >
          {error ?? note}
        </p>
      )}
    </div>
  );
}

function ColumnLabel({ children }: { readonly children: string }) {
  return (
    <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
      {children}
    </span>
  );
}
