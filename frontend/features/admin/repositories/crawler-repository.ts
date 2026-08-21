import "server-only";

import { BaseRepository } from "@/lib/repositories/base-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type JobStatus = Database["public"]["Enums"]["job_status"];
type EntityStatus = Database["public"]["Enums"]["entity_status"];

export interface CrawlerSourceRow {
  readonly id: string;
  readonly name: string;
  readonly baseUrl: string;
  readonly adapterKey: string;
  readonly crawlFrequency: string;
  readonly priority: number;
  readonly status: EntityStatus;
  readonly requestDelayMs: number;
  readonly respectRobotsTxt: boolean;
  readonly lastRunAt: string | null;
  readonly countryName: string;
}

export interface CrawlerRunRow {
  readonly id: string;
  readonly sourceName: string;
  /** Null while the run is queued — a worker sets it on claiming the job. */
  readonly startedAt: string | null;
  readonly queuedAt: string;
  readonly triggeredBy: string;
  readonly completedAt: string | null;
  readonly durationMs: number | null;
  readonly pagesScanned: number;
  readonly grantsNew: number;
  readonly grantsUpdated: number;
  readonly duplicatesFound: number;
  readonly errors: number;
  readonly status: JobStatus;
}

export interface CrawlerCacheStats {
  readonly trackedPages: number;
  readonly pagesWithHash: number;
  readonly queuedJobs: number;
  readonly failedJobs: number;
}

type Embedded<T> = T | T[] | null;

function toOne<T>(value: Embedded<T>): T | null {
  if (value === null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

/**
 * Read-only view of the crawler.
 *
 * `crawler_runs`, `crawler_pages` and `crawler_queue` have no write policy for
 * any role — only the pipeline's secret key writes there. The admin panel
 * observes; it does not edit history.
 */
export class CrawlerRepository extends BaseRepository {
  protected readonly entityName = "Crawler";

  async listSources(): Promise<readonly CrawlerSourceRow[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("crawler_sources")
      .select(
        "id, name, base_url, adapter_key, crawl_frequency, priority, status, request_delay_ms, respect_robots_txt, last_run_at, country:countries ( name )",
      )
      .order("priority", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      this.unwrap({ data: null, error }, "listSources");
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      baseUrl: row.base_url,
      adapterKey: row.adapter_key,
      crawlFrequency: row.crawl_frequency,
      priority: row.priority,
      status: row.status,
      requestDelayMs: row.request_delay_ms,
      respectRobotsTxt: row.respect_robots_txt,
      lastRunAt: row.last_run_at,
      countryName: toOne(row.country)?.name ?? "",
    }));
  }

  async listRecentRuns(limit: number): Promise<readonly CrawlerRunRow[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("crawler_runs")
      .select(
        "id, started_at, queued_at, triggered_by, completed_at, duration_ms, pages_scanned, grants_new, grants_updated, duplicates_found, errors, status, source:crawler_sources ( name )",
      )
      // Nulls first puts a queued run at the top, which is where someone who
      // has just pressed the button will look for it.
      .order("started_at", { ascending: false, nullsFirst: true })
      .limit(limit);

    if (error) {
      this.unwrap({ data: null, error }, "listRecentRuns");
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      sourceName: toOne(row.source)?.name ?? "Unknown source",
      startedAt: row.started_at,
      queuedAt: row.queued_at,
      triggeredBy: row.triggered_by,
      completedAt: row.completed_at,
      durationMs: row.duration_ms,
      pagesScanned: row.pages_scanned,
      grantsNew: row.grants_new,
      grantsUpdated: row.grants_updated,
      duplicatesFound: row.duplicates_found,
      errors: row.errors,
      status: row.status,
    }));
  }

  /**
   * The change-detection cache — how much work the pipeline is skipping.
   *
   * These read `grants` and `crawler_runs` rather than `crawler_pages` and
   * `crawler_queue`. The latter two are unused: the pipeline keeps its hash on
   * `grants.content_hash` and works from the adapter's discovery list, so
   * counting them showed four permanent zeros next to a paragraph claiming to
   * explain the cost lever. A stat that cannot move is worse than no stat.
   */
  async getCacheStats(): Promise<CrawlerCacheStats> {
    const supabase = await createSupabaseServerClient();

    const [tracked, hashed, queued, failed] = await Promise.all([
      supabase.from("grants").select("id", { count: "exact", head: true }),
      supabase
        .from("grants")
        .select("id", { count: "exact", head: true })
        .not("content_hash", "is", null),
      supabase
        .from("crawler_runs")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "running"]),
      supabase
        .from("crawler_runs")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed"),
    ]);

    return {
      trackedPages: tracked.count ?? 0,
      pagesWithHash: hashed.count ?? 0,
      queuedJobs: queued.count ?? 0,
      failedJobs: failed.count ?? 0,
    };
  }

  /**
   * Adapter keys the running pipeline has registered.
   *
   * Written by the worker on every tick — the adapters are Python, so a
   * hardcoded copy here would be wrong the first time one was added and nobody
   * remembered to update it. An empty result means the worker has not run yet,
   * which the caller treats as "unknown" rather than "none": blocking every
   * activation because a worker is down would be its own kind of wrong.
   */
  async listRegisteredAdapterKeys(): Promise<readonly string[]> {
    const supabase = await createSupabaseServerClient();

    const { data } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "registered_adapter_keys")
      .maybeSingle();

    const value = data?.value;

    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((entry): entry is string => typeof entry === "string");
  }

  async setSourceStatus(sourceId: string, status: "active" | "inactive"): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.from("crawler_sources").update({ status }).eq("id", sourceId);

    if (error) {
      this.unwrap({ data: null, error }, "setSourceStatus");
    }
  }

  /**
   * Whether a worker has picked up a job recently.
   *
   * There is no heartbeat table, so this infers liveness from evidence: a run
   * that reached `running` or later means something claimed it. Used only to
   * warn that a queued job may sit unattended — never to block queuing, since
   * queuing while the worker is down is a perfectly reasonable thing to do.
   */
  async hasRecentWorkerActivity(withinHours = 24): Promise<boolean> {
    const supabase = await createSupabaseServerClient();

    const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from("crawler_runs")
      .select("id", { count: "exact", head: true })
      .not("started_at", "is", null)
      .gte("started_at", since);

    return (count ?? 0) > 0;
  }

  /**
   * Queues a crawl. Returns null when one is already pending or running.
   *
   * Goes through the `request_crawl` function rather than inserting directly:
   * `crawler_runs` has no write policy for any role, deliberately, so that run
   * history cannot be rewritten through the API. The function is the one
   * narrow exception, and it checks the caller's role itself.
   */
  async requestCrawl(
    sourceId: string,
    pageLimit: number,
    requestedBy: string,
  ): Promise<string | null> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.rpc("request_crawl", {
      p_source_id: sourceId,
      p_page_limit: pageLimit,
      p_triggered_by: "manual",
      p_requested_by: requestedBy,
    });

    if (error) {
      this.unwrap({ data: null, error }, "requestCrawl");
    }

    return typeof data === "string" ? data : null;
  }
}

export const crawlerRepository = new CrawlerRepository();
