import "server-only";

import { BaseRepository } from "@/lib/repositories/base-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type GrantStatus = Database["public"]["Enums"]["grant_status"];

export interface AdminOverview {
  readonly grantsByStatus: Readonly<Record<GrantStatus, number>>;
  readonly totalGrants: number;
  readonly pendingReview: number;
  readonly closingSoon: number;
  readonly unverified: number;
  readonly newMessages: number;
  readonly lastCrawlAt: string | null;
  readonly aiCallsLast7Days: number;
}

export interface RecentGrant {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: GrantStatus;
  readonly updatedAt: string;
  readonly confidence: number | null;
}

const STATUSES: readonly GrantStatus[] = [
  "draft",
  "pending_review",
  "published",
  "archived",
  "expired",
];

const CLOSING_SOON_DAYS = 14;

export class AdminStatsRepository extends BaseRepository {
  protected readonly entityName = "Admin overview";

  /**
   * Counters for the dashboard.
   *
   * Every query uses `head: true`, so Postgres returns a count without
   * shipping any rows — the dashboard reads twelve numbers, not twelve tables.
   */
  async getOverview(): Promise<AdminOverview> {
    const supabase = await createSupabaseServerClient();
    const now = new Date();
    const soon = new Date(now.getTime() + CLOSING_SOON_DAYS * 86_400_000).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 86_400_000).toISOString();

    const countGrants = (status: GrantStatus) =>
      supabase
        .from("grants")
        .select("id", { count: "exact", head: true })
        .eq("status", status)
        .is("deleted_at", null);

    const [
      draft,
      pendingReview,
      published,
      archived,
      expired,
      closingSoon,
      unverified,
      messages,
      lastRun,
      aiCalls,
    ] = await Promise.all([
      countGrants("draft"),
      countGrants("pending_review"),
      countGrants("published"),
      countGrants("archived"),
      countGrants("expired"),
      supabase
        .from("grants")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .gte("closes_at", now.toISOString())
        .lte("closes_at", soon),
      supabase
        .from("grants")
        .select("id", { count: "exact", head: true })
        .eq("status", "published")
        .is("last_verified_at", null),
      supabase
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
      supabase
        .from("crawler_runs")
        .select("started_at")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("ai_generation_logs")
        .select("id", { count: "exact", head: true })
        .gte("created_at", weekAgo),
    ]);

    const grantsByStatus = {
      draft: draft.count ?? 0,
      pending_review: pendingReview.count ?? 0,
      published: published.count ?? 0,
      archived: archived.count ?? 0,
      expired: expired.count ?? 0,
    } satisfies Record<GrantStatus, number>;

    return {
      grantsByStatus,
      totalGrants: STATUSES.reduce((sum, status) => sum + grantsByStatus[status], 0),
      pendingReview: grantsByStatus.pending_review,
      closingSoon: closingSoon.count ?? 0,
      unverified: unverified.count ?? 0,
      newMessages: messages.count ?? 0,
      lastCrawlAt: lastRun.data?.started_at ?? null,
      aiCallsLast7Days: aiCalls.count ?? 0,
    };
  }

  async listRecentGrants(limit: number): Promise<readonly RecentGrant[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("grants")
      .select("id, title, slug, status, updated_at, ai_confidence")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) {
      this.unwrap({ data: null, error }, "listRecentGrants");
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      updatedAt: row.updated_at,
      confidence: row.ai_confidence,
    }));
  }
}

export const adminStatsRepository = new AdminStatsRepository();
