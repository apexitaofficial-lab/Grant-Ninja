import "server-only";

import { BaseRepository } from "@/lib/repositories/base-repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

/**
 * FAQs for any entity or static page.
 *
 * `faq_items` is polymorphic (decision D2), so PostgREST cannot embed it from a
 * parent query — it is fetched separately and joined in the service layer.
 * Living in `features/shared` because every entity type uses it.
 */

export type FaqEntityType = Database["public"]["Enums"]["faq_entity_type"];

export interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

/** Entity types whose FAQs hang off a row rather than a static page. */
const ENTITY_BACKED: readonly FaqEntityType[] = [
  "grant",
  "country",
  "state",
  "category",
  "organization",
];

export class FaqRepository extends BaseRepository {
  protected readonly entityName = "FAQ";

  async listFor(entityType: FaqEntityType, entityId: string | null): Promise<readonly FaqItem[]> {
    const supabase = await createSupabaseServerClient();

    let builder = supabase
      .from("faq_items")
      .select("question, answer, sort_order")
      .eq("entity_type", entityType);

    // A static-page FAQ carries no entity_id; the check constraint guarantees
    // the two cases never mix.
    builder = ENTITY_BACKED.includes(entityType)
      ? builder.eq("entity_id", entityId ?? "")
      : builder.is("entity_id", null);

    const { data, error } = await builder.order("sort_order", { ascending: true });

    if (error) {
      this.unwrap({ data: null, error }, "listFor");
    }

    return (data ?? []).map(({ question, answer }) => ({ question, answer }));
  }
}

export const faqRepository = new FaqRepository();
