"use client";

import { Archive, Check, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setGrantStatus } from "@/features/admin/actions/grant-actions";
import type { Database } from "@/types/database";

type GrantStatus = Database["public"]["Enums"]["grant_status"];

interface GrantReviewActionsProps {
  readonly grantId: string;
  readonly status: GrantStatus;
  readonly hasCategory: boolean;
}

/**
 * The review decision.
 *
 * Publishing is disabled without a category rather than allowed and then
 * rejected by the database — the constraint is real, so the button should
 * reflect it before it is pressed rather than after.
 */
export function GrantReviewActions({ grantId, status, hasCategory }: GrantReviewActionsProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<GrantStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function apply(next: GrantStatus) {
    setBusy(next);
    setError(null);

    try {
      const result = await setGrantStatus({ grantId, status: next, reason: reason || undefined });

      if (!result.ok) {
        setError(result.message);

        return;
      }

      setReason("");
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-border bg-muted/30 p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="decision-reason" className="text-xs">
          Note for the history
        </Label>
        <Input
          id="decision-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Checked against the notice — dates and ceiling correct"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {status !== "published" && (
          <Button
            type="button"
            onClick={() => apply("published")}
            disabled={busy !== null || !hasCategory}
            title={hasCategory ? undefined : "Assign a category before publishing"}
          >
            <Check className="size-4" aria-hidden="true" />
            {busy === "published" ? "Publishing…" : "Publish"}
          </Button>
        )}

        {status === "published" && (
          <Button
            type="button"
            variant="outline"
            onClick={() => apply("pending_review")}
            disabled={busy !== null}
          >
            <Undo2 className="size-4" aria-hidden="true" />
            {busy === "pending_review" ? "Unpublishing…" : "Unpublish"}
          </Button>
        )}

        {status !== "archived" && (
          <Button
            type="button"
            variant="outline"
            onClick={() => apply("archived")}
            disabled={busy !== null}
          >
            <Archive className="size-4" aria-hidden="true" />
            {busy === "archived" ? "Archiving…" : "Archive"}
          </Button>
        )}
      </div>

      {!hasCategory && (
        <p className="text-xs leading-relaxed text-warning">
          No category assigned, so this cannot be published. The pipeline normally applies
          &ldquo;Others&rdquo; when nothing matches — this grant predates that or the fallback is
          switched off.
        </p>
      )}

      {error !== null && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
