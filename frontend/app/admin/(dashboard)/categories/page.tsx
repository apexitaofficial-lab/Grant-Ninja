import type { Metadata } from "next";

import { CategoryRows } from "@/features/admin/components/category-rows";
import { referenceAdminRepository } from "@/features/admin/repositories/reference-admin-repository";
import { requireAdmin } from "@/features/admin/services/auth-service";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await requireAdmin("editor");

  const categories = await referenceAdminRepository.listCategories();

  const fallback = categories.find((category) => category.slug === "others");
  const total = categories.reduce((sum, category) => sum + category.grantCount, 0);
  const inFallback = fallback?.grantCount ?? 0;
  const fallbackShare = total === 0 ? 0 : Math.round((inFallback / total) * 100);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          How grants are classified and filtered. The pipeline matches an extracted grant against
          these names, so a category nobody has named the way agencies write it will never match.
        </p>
      </div>

      {fallback !== undefined && inFallback > 0 && (
        <div className="rounded-card border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">
              {inFallback} of {total} {total === 1 ? "grant is" : "grants are"} in &ldquo;
              {fallback.name}&rdquo; ({fallbackShare}%).
            </strong>{" "}
            That is the catch-all applied when nothing else matches. A large share is a signal the
            taxonomy needs extending rather than that the fallback is working — the grants sitting
            there show you which categories are missing.
          </p>
        </div>
      )}

      <div className="border-t border-border">
        <CategoryRows categories={categories} />
      </div>
    </div>
  );
}
