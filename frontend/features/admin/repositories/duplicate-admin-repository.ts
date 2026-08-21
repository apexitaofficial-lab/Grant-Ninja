import "server-only";

import { BaseRepository } from "@/lib/repositories/base-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type DuplicateDecision = Database["public"]["Enums"]["duplicate_decision"];
type GrantStatus = Database["public"]["Enums"]["grant_status"];

/** One side of a flagged pair, with everything a reviewer compares. */
export interface DuplicateSide {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: GrantStatus;
  readonly organizationName: string;
  readonly minimumAmount: number | null;
  readonly maximumAmount: number | null;
  readonly currency: string;
  readonly opensAt: string | null;
  readonly closesAt: string | null;
  readonly officialUrl: string | null;
  readonly sourceUrl: string | null;
  readonly shortDescription: string | null;
  readonly aiConfidence: number | null;
  readonly createdAt: string;
}

export interface DuplicatePair {
  readonly id: string;
  readonly confidence: number;
  readonly method: string;
  readonly decision: DuplicateDecision;
  readonly createdAt: string;
  readonly left: DuplicateSide;
  readonly right: DuplicateSide;
}

type Embedded<T> = T | T[] | null;

function toOne<T>(value: Embedded<T>): T | null {
  if (value === null) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

interface RawGrant {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly status: GrantStatus;
  readonly minimum_amount: number | null;
  readonly maximum_amount: number | null;
  readonly currency: string;
  readonly opens_at: string | null;
  readonly closes_at: string | null;
  readonly official_url: string | null;
  readonly source_url: string | null;
  readonly short_description: string | null;
  readonly ai_confidence: number | null;
  readonly created_at: string;
  readonly organization: Embedded<{ readonly name: string }>;
}

const GRANT_COLUMNS = `
  id, title, slug, status, minimum_amount, maximum_amount, currency,
  opens_at, closes_at, official_url, source_url, short_description,
  ai_confidence, created_at,
  organization:organizations ( name )
`;

function toSide(raw: RawGrant): DuplicateSide {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    status: raw.status,
    organizationName: toOne(raw.organization)?.name ?? "Unknown agency",
    minimumAmount: raw.minimum_amount,
    maximumAmount: raw.maximum_amount,
    currency: raw.currency,
    opensAt: raw.opens_at,
    closesAt: raw.closes_at,
    officialUrl: raw.official_url,
    sourceUrl: raw.source_url,
    shortDescription: raw.short_description,
    aiConfidence: raw.ai_confidence,
    createdAt: raw.created_at,
  };
}

/**
 * Pairs the pipeline could not decide about.
 *
 * The two grants are fetched through embedded relationships rather than a
 * second round trip, so the comparison a reviewer sees is one query.
 */
export class DuplicateAdminRepository extends BaseRepository {
  protected readonly entityName = "AdminDuplicate";

  async listUnresolved(limit = 50): Promise<readonly DuplicatePair[]> {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("duplicate_detection")
      .select(
        `id, confidence, method, decision, created_at,
         left:grants!duplicate_detection_grant_a_id_fkey ( ${GRANT_COLUMNS} ),
         right:grants!duplicate_detection_grant_b_id_fkey ( ${GRANT_COLUMNS} )`,
      )
      .eq("resolved", false)
      // Highest confidence first: those are the most likely to be genuine
      // merges and the quickest to decide.
      .order("confidence", { ascending: false })
      .limit(limit);

    if (error) {
      this.unwrap({ data: null, error }, "listUnresolved");
    }

    const pairs: DuplicatePair[] = [];

    for (const row of data ?? []) {
      const left = toOne(row.left as Embedded<RawGrant>);
      const right = toOne(row.right as Embedded<RawGrant>);

      // A cascade delete can leave a pair with a missing side. Skipping is
      // right: there is nothing left to compare against.
      if (left === null || right === null) {
        continue;
      }

      pairs.push({
        id: row.id,
        confidence: row.confidence,
        method: row.method,
        decision: row.decision,
        createdAt: row.created_at,
        left: toSide(left),
        right: toSide(right),
      });
    }

    return pairs;
  }

  async countUnresolved(): Promise<number> {
    const supabase = await createSupabaseServerClient();

    const { count } = await supabase
      .from("duplicate_detection")
      .select("id", { count: "exact", head: true })
      .eq("resolved", false);

    return count ?? 0;
  }

  async resolve(
    id: string,
    decision: DuplicateDecision,
    keepGrantId: string | null,
    reason: string,
  ): Promise<void> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.rpc("admin_resolve_duplicate", {
      p_id: id,
      p_decision: decision,
      // The parameter has a SQL default, so the generated type makes it
      // optional rather than nullable. Omitting it lets the default apply.
      p_keep_grant_id: keepGrantId ?? undefined,
      p_reason: reason,
    });

    if (error) {
      this.unwrap({ data: null, error }, "resolve");
    }
  }
}

export const duplicateAdminRepository = new DuplicateAdminRepository();
