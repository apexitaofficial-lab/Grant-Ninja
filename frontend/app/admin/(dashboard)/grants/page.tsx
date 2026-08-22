import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { AdminSearchField } from "@/features/admin/components/admin-search-field";
import { GrantStatusBadge } from "@/features/admin/components/grant-status-badge";
import type { AdminGrantView } from "@/features/admin/repositories/grant-admin-repository";
import { grantAdminRepository } from "@/features/admin/repositories/grant-admin-repository";
import { requireAdmin } from "@/features/admin/services/auth-service";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

export const metadata: Metadata = { title: "Grants" };

type GrantStatus = Database["public"]["Enums"]["grant_status"];

const STATUS_TABS: readonly { readonly label: string; readonly value: GrantStatus | "all" }[] = [
  { label: "Needs review", value: "pending_review" },
  { label: "Published", value: "published" },
  { label: "Drafts", value: "draft" },
  { label: "Archived", value: "archived" },
  { label: "All", value: "all" },
];

function parseStatus(value: string | undefined): GrantStatus | undefined {
  if (value === undefined || value === "all") {
    return undefined;
  }

  const known: readonly GrantStatus[] = [
    "draft",
    "pending_review",
    "published",
    "archived",
    "expired",
  ];

  return known.includes(value as GrantStatus) ? (value as GrantStatus) : undefined;
}

/**
 * The grants list — MASTER_PROJECT_SPEC.md Part 5A §7.
 *
 * Opens on "Needs review" rather than "All". The pipeline holds anything it is
 * not confident about, so that queue is the actual work; a list of everything
 * is a reference, not a to-do.
 */
export default async function AdminGrantsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("editor");

  const params = await searchParams;
  const viewParam = typeof params["view"] === "string" ? params["view"] : undefined;
  const view: AdminGrantView | undefined =
    viewParam === "unverified" || viewParam === "closing" ? viewParam : undefined;

  // A view arriving from the dashboard replaces the status tabs rather than
  // combining with them — "unverified" already means published, so pairing it
  // with a status filter could only ever produce an empty list.
  const statusParam =
    view !== undefined
      ? "all"
      : typeof params["status"] === "string"
        ? params["status"]
        : "pending_review";
  const search = typeof params["q"] === "string" ? params["q"] : undefined;
  const page = Number(typeof params["page"] === "string" ? params["page"] : "1") || 1;

  const [{ items, total }, counts] = await Promise.all([
    grantAdminRepository.list({
      status: view === undefined ? parseStatus(statusParam) : undefined,
      view,
      search,
      page,
    }),
    grantAdminRepository.countsByStatus(),
  ]);

  const VIEW_COPY = {
    unverified: {
      title: "Published, never verified",
      hint: "These are live on the site but nobody has confirmed the details against the original notice since they were extracted.",
    },
    closing: {
      title: "Closing within 14 days",
      hint: "Published grants whose deadline is imminent. Worth a check that the date is still right before applicants rely on it.",
    },
  } as const;

  // Handed to the search field so typing preserves the status filter rather
  // than dropping the reviewer back to "everything".
  const currentQuery = new URLSearchParams(
    Object.entries(params).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value] as [string, string]] : [],
    ),
  ).toString();

  /**
   * Switching status keeps the search term. Dropping it would silently widen
   * the list back to everything the moment a reviewer changed tab, which reads
   * as the filter breaking rather than as a deliberate reset. Page number is
   * left off on purpose — page 4 of the old result set means nothing in the new
   * one.
   */
  const statusHref = (value: GrantStatus | "all"): string => {
    const next = new URLSearchParams();

    next.set("status", value);

    if (search !== undefined && search !== "") {
      next.set("q", search);
    }

    return `/admin/grants?${next.toString()}`;
  };

  const countFor = (value: GrantStatus | "all"): number | null => {
    switch (value) {
      case "pending_review":
        return counts.pendingReview;
      case "published":
        return counts.published;
      case "draft":
        return counts.draft;
      case "archived":
        return counts.archived;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Grants</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Everything the pipeline has found, and everything waiting on a decision.
        </p>
      </div>

      {view !== undefined && (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-card border border-border bg-muted/30 px-4 py-3">
          <div>
            <p className="text-sm font-medium">{VIEW_COPY[view].title}</p>
            <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted-foreground">
              {VIEW_COPY[view].hint}
            </p>
          </div>
          <Link
            href="/admin/grants?status=pending_review"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Clear filter
          </Link>
        </div>
      )}

      {/* The repository has always supported a search term; until now nothing
          rendered a box to type it into, so the capability was unreachable. */}
      <AdminSearchField
        label="Search grants"
        placeholder="Search by title"
        initialValue={search ?? ""}
        currentQuery={currentQuery}
      />

      <nav
        aria-label="Filter by status"
        className="flex flex-wrap gap-2 border-b border-border pb-3"
      >
        {STATUS_TABS.map((tab) => {
          const isActive = statusParam === tab.value;
          const count = countFor(tab.value);

          return (
            <Link
              key={tab.value}
              href={statusHref(tab.value)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {tab.label}
              {count !== null && <span className="font-mono tabular-nums opacity-70">{count}</span>}
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium">
            {statusParam === "pending_review" ? "Nothing waiting for review" : "No grants here"}
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
            {statusParam === "pending_review"
              ? "The pipeline holds a grant when its confidence is below the threshold, or when it could not resolve an agency or category."
              : "Run a crawl from the Crawler page, or change the filter above."}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border">
                  <Th>Grant</Th>
                  <Th>Agency</Th>
                  <Th>Category</Th>
                  <Th className="text-right">Award</Th>
                  <Th className="text-right">Confidence</Th>
                  <Th>Closes</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((grant) => (
                  <tr key={grant.id} className="border-b border-border last:border-0">
                    <Td>
                      <Link
                        href={`/admin/grants/${grant.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {grant.title}
                      </Link>
                    </Td>
                    <Td className="text-xs text-muted-foreground">{grant.organizationName}</Td>
                    <Td className="text-xs">
                      {grant.categoryNames.length === 0 ? (
                        // Blocks publication, so it is called out rather than
                        // shown as an empty cell.
                        <Badge variant="outline" className="text-destructive">
                          none
                        </Badge>
                      ) : (
                        grant.categoryNames.join(", ")
                      )}
                    </Td>
                    <Td className="text-right font-mono text-xs tabular-nums">
                      {grant.maximumAmount === null
                        ? "—"
                        : formatCurrency(grant.maximumAmount, grant.currency)}
                    </Td>
                    <Td className="text-right font-mono text-xs tabular-nums">
                      {grant.aiConfidence ?? "—"}
                    </Td>
                    <Td className="font-mono text-xs">
                      {grant.closesAt === null ? "—" : formatDate(grant.closesAt)}
                    </Td>
                    <Td>
                      <GrantStatusBadge status={grant.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            Showing {items.length} of {total}
            {page > 1 ? ` · page ${page}` : ""}
          </p>
        </>
      )}
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
