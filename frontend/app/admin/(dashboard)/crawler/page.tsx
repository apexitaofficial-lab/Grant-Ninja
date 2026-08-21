import { CircleCheck, CircleDashed, CircleX, Loader } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { RunCrawlButton } from "@/features/admin/components/run-crawl-button";
import { SourceStatusToggle } from "@/features/admin/components/source-status-toggle";
import { crawlerRepository } from "@/features/admin/repositories/crawler-repository";
import { hasAtLeast, requireAdmin } from "@/features/admin/services/auth-service";
import { describeSchedule } from "@/lib/cron";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Crawler" };

/**
 * Crawler Center — MASTER_PROJECT_SPEC.md Part 5A §15.
 *
 * Observation only. The pipeline writes these tables with the secret key and
 * nothing here can edit them, which is deliberate: a run history you can
 * rewrite is not a history.
 */
export default async function CrawlerCenterPage() {
  const admin = await requireAdmin("viewer");

  const [sources, runs, cache, workerSeen, registeredAdapters] = await Promise.all([
    crawlerRepository.listSources(),
    crawlerRepository.listRecentRuns(15),
    crawlerRepository.getCacheStats(),
    crawlerRepository.hasRecentWorkerActivity(),
    crawlerRepository.listRegisteredAdapterKeys(),
  ]);

  // Empty means no worker has reported in yet, so adapter support is unknown
  // rather than absent — the toggle stays usable instead of locking everything.
  const adapterSupportUnknown = registeredAdapters.length === 0;

  const activeSources = sources.filter((source) => source.status === "active");
  const canRunCrawl = hasAtLeast(admin.role, "editor");
  // Switching a source on or off is configuration, not content, so it sits a
  // rung higher — and must match what `setSourceStatus` enforces, or an editor
  // sees a control that bounces them to the dashboard.
  const canManageSources = hasAtLeast(admin.role, "admin");

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Crawler</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What the pipeline is monitoring, and what it has done.
        </p>
      </div>

      <section aria-labelledby="cache">
        <SectionHeading id="cache">Pipeline state</SectionHeading>
        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-6 border-y border-border py-6 lg:grid-cols-5">
          <Stat label="Active sources" value={`${activeSources.length} / ${sources.length}`} />
          <Stat label="Grants tracked" value={cache.trackedPages} />
          <Stat label="With content hash" value={cache.pagesWithHash} />
          <Stat label="Queued or running" value={cache.queuedJobs} />
          <Stat label="Failed runs" value={cache.failedJobs} />
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          A grant with a content hash can be skipped on the next crawl if its page has not changed —
          no AI call, no republish.
        </p>
      </section>

      {canRunCrawl && (
        <section aria-labelledby="run">
          <SectionHeading id="run">Run a crawl</SectionHeading>
          <div className="mt-4">
            <RunCrawlButton
              sources={activeSources.map((source) => ({ id: source.id, name: source.name }))}
              workerSeen={workerSeen}
            />
          </div>
        </section>
      )}

      <section aria-labelledby="sources">
        <SectionHeading id="sources">Sources</SectionHeading>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <Th>Source</Th>
                <Th>Adapter</Th>
                {/* The zone belongs in the header, not repeated on every row —
                    but it has to be somewhere, because the scheduler compares
                    against UTC and "02:00" read as local time is simply wrong. */}
                <Th>Schedule (UTC)</Th>
                <Th className="text-right">Delay</Th>
                <Th>Robots</Th>
                <Th>Last run</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.id} className="border-b border-border last:border-0">
                  <Td>
                    <span className="font-medium">{source.name}</span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {source.baseUrl}
                    </span>
                  </Td>
                  <Td className="font-mono text-xs">{source.adapterKey}</Td>
                  <Td>
                    <ScheduleCell expression={source.crawlFrequency} />
                  </Td>
                  <Td className="text-right font-mono text-xs tabular-nums">
                    {source.requestDelayMs} ms
                  </Td>
                  <Td className="text-xs">{source.respectRobotsTxt ? "Respected" : "Ignored"}</Td>
                  <Td className="font-mono text-xs">
                    {source.lastRunAt === null ? "Never" : formatDate(source.lastRunAt)}
                  </Td>
                  <Td>
                    {canManageSources ? (
                      <SourceStatusToggle
                        sourceId={source.id}
                        adapterKey={source.adapterKey}
                        status={source.status === "active" ? "active" : "inactive"}
                        hasAdapter={registeredAdapters.includes(source.adapterKey)}
                        adapterSupportUnknown={adapterSupportUnknown}
                      />
                    ) : (
                      <Badge variant={source.status === "active" ? "secondary" : "outline"}>
                        {source.status}
                      </Badge>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          The scheduler only visits active sources. Pausing one is the way to stop crawling a site
          that has started blocking the bot or is producing noise — it changes nothing else, and the
          grants already collected stay published. A source cannot be activated until an adapter
          exists for it, because the scheduler would otherwise queue crawls that can only fail.
          {adapterSupportUnknown && (
            <>
              {" "}
              No worker has reported which adapters it has, so that check is currently unenforced.
            </>
          )}
        </p>
      </section>

      <section aria-labelledby="runs">
        <SectionHeading id="runs">Recent runs</SectionHeading>
        {runs.length === 0 ? (
          <div className="mt-4 rounded-card border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
            <p className="text-sm font-medium">No runs recorded yet</p>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
              The pipeline writes a row here every time it crawls a source. Once the first adapter
              runs, its pages scanned, grants added and errors will appear in this table.
            </p>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <Th>Source</Th>
                  <Th>Trigger</Th>
                  <Th>Started</Th>
                  <Th className="text-right">Pages</Th>
                  <Th className="text-right">New</Th>
                  <Th className="text-right">Updated</Th>
                  <Th className="text-right">Duplicates</Th>
                  <Th className="text-right">Errors</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id} className="border-b border-border last:border-0">
                    <Td className="font-medium">{run.sourceName}</Td>
                    <Td className="text-xs text-muted-foreground">{run.triggeredBy}</Td>
                    <Td className="font-mono text-xs">
                      {run.startedAt === null ? (
                        // Queued but unclaimed. Showing the queued time here
                        // instead would read as though it had started.
                        <span className="text-muted-foreground">waiting for worker</span>
                      ) : (
                        formatDate(run.startedAt)
                      )}
                    </Td>
                    <Td className="text-right font-mono tabular-nums">{run.pagesScanned}</Td>
                    <Td className="text-right font-mono tabular-nums">{run.grantsNew}</Td>
                    <Td className="text-right font-mono tabular-nums">{run.grantsUpdated}</Td>
                    <Td className="text-right font-mono tabular-nums">{run.duplicatesFound}</Td>
                    <Td
                      className={cn(
                        "text-right font-mono tabular-nums",
                        run.errors > 0 && "text-destructive",
                      )}
                    >
                      {run.errors}
                    </Td>
                    <Td>
                      <RunStatus status={run.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const STATUS_ICON = {
  completed: CircleCheck,
  running: Loader,
  failed: CircleX,
  pending: CircleDashed,
  cancelled: CircleDashed,
} as const;

const STATUS_TONE = {
  completed: "text-success",
  running: "text-primary",
  failed: "text-destructive",
  pending: "text-muted-foreground",
  cancelled: "text-muted-foreground",
} as const;

function RunStatus({ status }: { readonly status: keyof typeof STATUS_ICON }) {
  const Icon = STATUS_ICON[status];

  return (
    <span className={cn("flex items-center gap-1.5 text-xs", STATUS_TONE[status])}>
      <Icon className="size-3.5" aria-hidden="true" />
      {status}
    </span>
  );
}

/**
 * The schedule in words, with the cron expression kept underneath.
 *
 * Both, not one: the sentence is what makes the table readable at a glance,
 * and the expression is what an operator edits and what the scheduler actually
 * evaluates. Dropping it would hide the thing being configured.
 */
function ScheduleCell({ expression }: { readonly expression: string }) {
  const schedule = describeSchedule(expression);

  return (
    <span className="block">
      <span className={cn("block text-xs", !schedule.isValid && "text-destructive")}>
        {schedule.text}
      </span>
      {schedule.isValid && (
        <span className="block font-mono text-[10px] text-muted-foreground">{expression}</span>
      )}
      {!schedule.isValid && (
        <span className="block text-[10px] text-destructive">
          Not a valid cron expression — this source will never be scheduled.
        </span>
      )}
    </span>
  );
}

function SectionHeading({ id, children }: { readonly id: string; readonly children: string }) {
  return (
    <h2
      id={id}
      className="border-b border-border pb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase"
    >
      {children}
    </h2>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: number | string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Th({ children, className }: { readonly children: string; readonly className?: string }) {
  return (
    <th
      className={cn(
        "px-3 py-2 text-left font-mono text-[10px] tracking-widest text-muted-foreground uppercase",
        className,
      )}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
}: {
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return <td className={cn("px-3 py-3 align-top", className)}>{children}</td>;
}
