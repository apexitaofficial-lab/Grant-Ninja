import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { routes } from "@/config/routes";
import { GrantCreateForm } from "@/features/admin/components/grant-create-form";
import { referenceAdminRepository } from "@/features/admin/repositories/reference-admin-repository";
import { requireAdmin } from "@/features/admin/services/auth-service";

export const metadata: Metadata = { title: "Add a grant" };

/**
 * Manual grant entry.
 *
 * Reference data is loaded here, on the server, and handed to the form whole.
 * Both lists are small, and fetching agencies again every time the country
 * changes would put a spinner between two fields that depend on each other.
 */
export default async function NewGrantPage() {
  await requireAdmin("editor");

  const [countries, categories, options] = await Promise.all([
    referenceAdminRepository.listCountries(),
    referenceAdminRepository.listCategories(),
    referenceAdminRepository.listGrantFormOptions(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          href={routes.admin.grants}
          className="flex w-fit items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:underline"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Back to grants
        </Link>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add a grant</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            For grants entered by hand rather than collected by the crawler. Only the title, country,
            agency and one category are required to save a draft; publishing also needs the official
            URL.
          </p>
        </div>
      </div>

      <GrantCreateForm
        data={{
          countries,
          categories,
          agencies: options.agencies,
          states: options.states,
        }}
      />
    </div>
  );
}
