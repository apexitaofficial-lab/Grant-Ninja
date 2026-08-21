"use client";

import { Pause, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setSourceStatus } from "@/features/admin/actions/crawler-actions";

interface SourceStatusToggleProps {
  readonly sourceId: string;
  readonly adapterKey: string;
  readonly status: "active" | "inactive";
  /** False when the pipeline has no adapter for this source. */
  readonly hasAdapter: boolean;
  /** True before any worker has reported in, so adapter support is unknown. */
  readonly adapterSupportUnknown: boolean;
}

/**
 * Switch a source on or off.
 *
 * Deliberately asymmetric. Pausing is always available — a site that starts
 * blocking the crawler has to be stoppable immediately. Activating is blocked
 * when no adapter exists, because the scheduler would then queue crawls the
 * worker can only fail, and a button that quietly creates failing jobs is
 * worse than no button.
 */
export function SourceStatusToggle({
  sourceId,
  adapterKey,
  status,
  hasAdapter,
  adapterSupportUnknown,
}: SourceStatusToggleProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = status === "active";
  const blocked = !isActive && !hasAdapter && !adapterSupportUnknown;

  async function toggle() {
    setBusy(true);
    setError(null);

    try {
      const result = await setSourceStatus({
        sourceId,
        status: isActive ? "inactive" : "active",
      });

      if (!result.ok) {
        setError(result.message);

        return;
      }

      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex items-center gap-2">
        <Badge variant={isActive ? "secondary" : "outline"}>{status}</Badge>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={toggle}
          disabled={busy || blocked}
          title={
            blocked
              ? `No adapter named "${adapterKey}" is registered yet`
              : isActive
                ? "Pause scheduled crawls of this source"
                : "Include this source in scheduled crawls"
          }
          className="h-7 px-2 text-xs"
        >
          {isActive ? (
            <Pause className="size-3.5" aria-hidden="true" />
          ) : (
            <Play className="size-3.5" aria-hidden="true" />
          )}
          {busy ? "…" : isActive ? "Pause" : "Activate"}
        </Button>
      </div>

      {blocked && (
        <span className="text-[10px] leading-relaxed text-muted-foreground">
          Needs an adapter first
        </span>
      )}

      {error !== null && (
        <span role="alert" className="max-w-56 text-[10px] leading-relaxed text-destructive">
          {error}
        </span>
      )}
    </div>
  );
}
