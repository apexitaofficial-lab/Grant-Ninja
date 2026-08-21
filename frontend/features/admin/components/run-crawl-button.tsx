"use client";

import { Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requestCrawl } from "@/features/admin/actions/crawler-actions";

export interface CrawlableSource {
  readonly id: string;
  readonly name: string;
}

interface RunCrawlButtonProps {
  readonly sources: readonly CrawlableSource[];
  /** Whether a worker has been seen recently. Drives the warning, not the button. */
  readonly workerSeen: boolean;
}

const DEFAULT_PAGE_LIMIT = 10;

/**
 * Queues a crawl from the admin panel.
 *
 * The wording is deliberate throughout: this *queues* a job, it does not run
 * one. The crawl happens in the Python worker, so claiming "crawling…" here
 * would be a guess the page cannot verify — and if no worker is running, a
 * confident spinner would be actively misleading. The run appears in the table
 * below as `pending`, then `running`, then `completed`, which is the honest
 * signal.
 */
export function RunCrawlButton({ sources, workerSeen }: RunCrawlButtonProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [isBusy, setIsBusy] = useState(false);
  const [sourceId, setSourceId] = useState(sources[0]?.id ?? "");
  const [pageLimit, setPageLimit] = useState(String(DEFAULT_PAGE_LIMIT));
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; message: string } | null>(null);

  if (sources.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No active source to crawl. Activate one once its adapter exists.
      </p>
    );
  }

  async function onRun() {
    setFeedback(null);
    setIsBusy(true);

    try {
      const result = await requestCrawl({ sourceId, pageLimit });

      if (!result.ok) {
        setFeedback({ tone: "error", message: result.message });

        return;
      }

      setFeedback({ tone: "ok", message: result.data.message });
      // The runs table is server-rendered, so it needs a refresh to show the
      // row that was just queued.
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="crawl-source" className="text-xs">
            Source
          </Label>
          <Select value={sourceId} onValueChange={setSourceId}>
            <SelectTrigger id="crawl-source" className="w-56">
              <SelectValue placeholder="Choose a source" />
            </SelectTrigger>
            <SelectContent>
              {sources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="crawl-pages" className="text-xs">
            Pages
          </Label>
          <Input
            id="crawl-pages"
            type="number"
            min={1}
            max={100}
            value={pageLimit}
            onChange={(event) => setPageLimit(event.target.value)}
            className="w-24 font-mono tabular-nums"
          />
        </div>

        <Button type="button" onClick={onRun} disabled={isBusy}>
          <Play className="size-4" aria-hidden="true" />
          {isBusy ? "Queuing…" : "Run crawl now"}
        </Button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Each page costs one AI call unless its content is unchanged since the last crawl. Start
        small.
      </p>

      {!workerSeen && (
        <p className="text-xs leading-relaxed text-warning" role="status">
          No worker has run recently. The job will queue and wait — start one with{" "}
          <code className="font-mono">python -m app.worker</code> in the <code>python/</code>{" "}
          folder.
        </p>
      )}

      {feedback !== null && (
        <p
          role="status"
          className={
            feedback.tone === "error"
              ? "text-xs font-medium text-destructive"
              : "text-xs font-medium text-success"
          }
        >
          {feedback.message}
        </p>
      )}
    </div>
  );
}
