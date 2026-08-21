import type { Metadata } from "next";

import { DuplicatePairCard } from "@/features/admin/components/duplicate-pair-card";
import { duplicateAdminRepository } from "@/features/admin/repositories/duplicate-admin-repository";
import { requireAdmin } from "@/features/admin/services/auth-service";

export const metadata: Metadata = { title: "Duplicates" };

/**
 * The duplicate review queue.
 *
 * The pipeline flags a pair when its ladder cannot decide — a fuzzy title
 * match in the uncertain band, or a Gemini comparison below its confidence
 * bar. Those rows were being written and never read, so a flagged pair waited
 * forever and the grant held alongside it stayed a draft indefinitely.
 */
export default async function AdminDuplicatesPage() {
  await requireAdmin("editor");

  const pairs = await duplicateAdminRepository.listUnresolved();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Duplicates</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Pairs the pipeline could not decide about on its own. Exact matches are merged
          automatically and obvious differences are left alone — what reaches this queue is the
          narrow band where a human is genuinely needed.
        </p>
      </div>

      {pairs.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium">Nothing waiting</p>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-muted-foreground">
            The duplicate ladder resolves most pairs without help: identical content is matched by
            hash, the same page by its URL, and titles differing only by a phase, year or track are
            treated as separate grants outright. A pair arrives here only when those tests are
            inconclusive.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {pairs.map((pair) => (
            <DuplicatePairCard key={pair.id} pair={pair} />
          ))}
        </div>
      )}
    </div>
  );
}
