import type { Metadata } from "next";

import { CountryRows } from "@/features/admin/components/country-rows";
import { referenceAdminRepository } from "@/features/admin/repositories/reference-admin-repository";
import { requireAdmin } from "@/features/admin/services/auth-service";

export const metadata: Metadata = { title: "Countries" };

export default async function AdminCountriesPage() {
  await requireAdmin("editor");

  const countries = await referenceAdminRepository.listCountries();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Countries</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Each country is a public section of the site at{" "}
          <code className="font-mono text-xs">/countries/&lt;slug&gt;</code>. Making one inactive
          hides it and its grants from the public site without deleting anything.
        </p>
      </div>

      <div className="border-t border-border">
        <CountryRows countries={countries} />
      </div>
    </div>
  );
}
