"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { FilterCategoryOption } from "@/features/grants/components/grant-filter-panel";
import { GrantFilterPanel } from "@/features/grants/components/grant-filter-panel";
import type { GrantFilters } from "@/features/grants/types/grant";

interface GrantFiltersDrawerProps {
  readonly categories: readonly FilterCategoryOption[];
  readonly selected: GrantFilters;
  readonly activeCount: number;
  readonly currentQuery: string;
}

/**
 * Filters on a phone.
 *
 * A sidebar that collapses to a stack would push results below a screenful of
 * checkboxes, so on small screens the same panel moves into a drawer and the
 * trigger carries a count — the one thing you need to know without opening it.
 */
export function GrantFiltersDrawer({
  categories,
  selected,
  activeCount,
  currentQuery,
}: GrantFiltersDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="lg:hidden">
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="ml-1 font-mono text-[10px] tabular-nums">
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[320px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Filter Grants</SheetTitle>
        </SheetHeader>

        <GrantFilterPanel
          categories={categories}
          selected={selected}
          activeCount={activeCount}
          currentQuery={currentQuery}
          className="px-4 pb-8"
        />

        <div className="sticky bottom-0 border-t border-border bg-background p-4">
          <Button className="w-full" onClick={() => setOpen(false)}>
            Show Results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
