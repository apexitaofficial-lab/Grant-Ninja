import type { Metadata } from "next";
import Link from "next/link";

import { AgencyRows } from "@/features/admin/components/agency-rows";
import { referenceAdminRepository } from "@/features/admin/repositories/reference-admin-repository";
import { requireAdmin } from "@/features/admin/services/auth-service";

export const metadata: Metadata = { title: "Agencies" };

const PER_PAGE = 25;

export default async function AdminAgenciesPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin("editor");

  const params = await searchParams;
  const search = typeof params["q"] === "string" ? params["q"] : undefined;
  const page = Math.max(1, Number(typeof params["page"] === "string" ? params["page"] : "1") || 1);

  const { items, total } = await referenceAdminRepository.listAgencies({
    search,
    page,
    perPage: PER_PAGE,
  });

  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));
  const query = (target: number): string => {
    const parts = [`page=${target}`];

    if (search !== undefined && search !== "") {
      parts.push(`q=${encodeURIComponent(search)}`);
    }

    return `/admin/agencies?${parts.join("&")}`;
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agencies</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The bodies that award grants. Most were imported from the grants.gov agency list, which is
          why some carry official names nobody says out loud — renaming one here changes how it
          appears on the site, and the pipeline still matches the original spelling.
        </p>
      </div>

      <form action="/admin/agencies" className="flex flex-wrap gap-2">
        <input
          type="search"
          name="q"
          defaultValue={search ?? ""}
          placeholder="Search agencies"
          aria-label="Search agencies"
          className="h-9 w-64 rounded-md border border-input bg-transparent px-3 text-sm"
        />
        <button
          type="submit"
          className="h-9 rounded-md border border-input px-3 text-sm hover:bg-muted"
        >
          Search
        </button>
        {search !== undefined && search !== "" && (
          <Link
            href="/admin/agencies"
            className="flex h-9 items-center px-2 text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Clear
          </Link>
        )}
      </form>

      {items.length === 0 ? (
        <div className="rounded-card border border-dashed border-border bg-muted/30 px-6 py-12 text-center">
          <p className="text-sm font-medium">No agencies match that search</p>
        </div>
      ) : (
        <>
          <div className="border-t border-border">
            <AgencyRows agencies={items} />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {items.length} of {total} · page {page} of {lastPage}
            </span>
            <span className="flex gap-3">
              {page > 1 && (
                <Link href={query(page - 1)} className="underline-offset-4 hover:underline">
                  Previous
                </Link>
              )}
              {page < lastPage && (
                <Link href={query(page + 1)} className="underline-offset-4 hover:underline">
                  Next
                </Link>
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
