import { AlertTriangle, ArrowUpRight, Clock, FileWarning, Inbox } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/routes";
import { adminStatsRepository } from "@/features/admin/repositories/admin-stats-repository";
import { requireAdmin } from "@/features/admin/services/auth-service";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const admin = await requireAdmin("viewer");

  const [overview, recent] = await Promise.all([
    adminStatsRepository.getOverview(),
    adminStatsRepository.listRecentGrants(8),
  ]);

  const firstName = admin.displayName.split(" ")[0] ?? admin.displayName;

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {firstName === "" ? "Dashboard" : `Welcome back, ${firstName}`}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What the platform needs from you right now.
        </p>
      </div>

      {/*
        Attention first, inventory second. A dashboard that opens with a big
        "total grants" number tells you nothing you can act on.
      */}
      <section aria-labelledby="attention">
        <SectionHeading id="attention">Needs attention</SectionHeading>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AttentionCard
            icon={FileWarning}
            label="Awaiting review"
            value={overview.pendingReview}
            hint="Extractions below the confidence threshold"
            tone={overview.pendingReview > 0 ? "warning" : "quiet"}
          />
          <AttentionCard
            icon={AlertTriangle}
            label="Unverified"
            value={overview.unverified}
            hint="Published with no verification date"
            tone={overview.unverified > 0 ? "warning" : "quiet"}
          />
          <AttentionCard
            icon={Clock}
            label="Closing in 14 days"
            value={overview.closingSoon}
            hint="Published grants about to expire"
            tone="quiet"
          />
          <AttentionCard
            icon={Inbox}
            label="New messages"
            value={overview.newMessages}
            hint="Unread contact enquiries"
            tone={overview.newMessages > 0 ? "info" : "quiet"}
          />
        </div>
      </section>

      <section aria-labelledby="inventory">
        <SectionHeading id="inventory">Grants by status</SectionHeading>
        <dl className="mt-4 grid grid-cols-2 gap-x-8 gap-y-6 border-y border-border py-6 sm:grid-cols-3 lg:grid-cols-5">
          {(
            [
              ["Published", overview.grantsByStatus.published],
              ["Pending review", overview.grantsByStatus.pending_review],
              ["Draft", overview.grantsByStatus.draft],
              ["Expired", overview.grantsByStatus.expired],
              ["Archived", overview.grantsByStatus.archived],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
                {label}
              </dt>
              <dd className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="pipeline">
        <SectionHeading id="pipeline">Pipeline</SectionHeading>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-border p-5">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              Last crawl
            </p>
            <p className="mt-1 font-mono text-lg font-semibold">
              {overview.lastCrawlAt === null ? "Never run" : formatDate(overview.lastCrawlAt)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {overview.lastCrawlAt === null
                ? "The Python pipeline has not reported a run yet."
                : "Most recent crawler run recorded."}
            </p>
          </div>

          <div className="rounded-card border border-border p-5">
            <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
              AI calls, last 7 days
            </p>
            <p className="mt-1 font-mono text-lg font-semibold tabular-nums">
              {overview.aiCallsLast7Days}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {overview.aiCallsLast7Days === 0
                ? "No extraction activity recorded yet."
                : "Requests logged by the extraction pipeline."}
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="recent">
        <SectionHeading id="recent">Recently updated</SectionHeading>
        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No grants in the database yet. They will appear here as the crawler publishes them.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {recent.map((grant) => (
              <li key={grant.id} className="flex items-center gap-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{grant.title}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {formatDate(grant.updatedAt)}
                    {grant.confidence !== null && ` · confidence ${grant.confidence}`}
                  </p>
                </div>

                <Badge variant={grant.status === "published" ? "secondary" : "outline"}>
                  {grant.status.replace("_", " ")}
                </Badge>

                {grant.status === "published" && (
                  <Link
                    href={routes.grant(grant.slug)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label={`View ${grant.title} on the public site`}
                  >
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
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

const TONE_STYLES = {
  warning: "border-warning/40 bg-warning/5",
  info: "border-primary/30 bg-primary/5",
  quiet: "border-border",
} as const;

function AttentionCard({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  readonly icon: typeof Clock;
  readonly label: string;
  readonly value: number;
  readonly hint: string;
  readonly tone: keyof typeof TONE_STYLES;
}) {
  return (
    <div className={cn("rounded-card border p-5", TONE_STYLES[tone])}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </div>
      <p className="mt-2 font-mono text-3xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}
