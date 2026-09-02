"use client";

import { Info } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FILTER_PARAM_KEYS,
  FUNDING_SOURCE_LABELS,
  WINDOW_LABELS,
} from "@/features/grants/services/grant-filter-params";
import type {
  GrantFilters,
  GrantFundingSource,
  GrantWindowFilter,
} from "@/features/grants/types/grant";
import { useQueryParams } from "@/features/shared/hooks/use-query-params";
import { cn } from "@/lib/utils";

export interface FilterCategoryOption {
  readonly name: string;
  readonly slug: string;
  readonly grantCount: number;
}

interface GrantFilterPanelProps {
  readonly categories: readonly FilterCategoryOption[];
  /**
   * Selected state comes from the server, which already parsed the URL.
   *
   * Reading it here with `useSearchParams()` instead would render an empty
   * selection during SSR and the real selection on the client — a hydration
   * mismatch on every filtered URL, which React resolves by abandoning the
   * boundary and leaving the whole panel dead. The hook is still used for
   * *writing*, inside event handlers, where render output is not involved.
   */
  readonly selected: GrantFilters;
  readonly activeCount: number;
  /** The page's current query string, for building the next URL. */
  readonly currentQuery: string;
  readonly className?: string;
}

const WINDOW_ORDER: readonly GrantWindowFilter[] = ["open", "closing_soon", "upcoming", "closed"];

const SOURCE_ORDER: readonly GrantFundingSource[] = ["federal", "state", "private"];

/**
 * The shared filter system.
 *
 * Every control writes to the URL through one hook, so the panel, the sort
 * control and the search box cannot disagree about when to reset pagination.
 * Nothing is applied on a "Search" button — changing a control changes the
 * results, which is what people expect from a faceted list.
 */
export function GrantFilterPanel({
  categories,
  selected,
  activeCount,
  currentQuery,
  className,
}: GrantFilterPanelProps) {
  const { isPending, setValue, toggleValue, clearAll } = useQueryParams(currentQuery);

  const selectedCategories = selected.categorySlugs ?? [];
  const selectedSources = selected.fundingSources ?? [];
  const selectedWindow = selected.window ?? null;
  const minFunding = selected.minFunding === undefined ? "" : String(selected.minFunding);
  const maxFunding = selected.maxFunding === undefined ? "" : String(selected.maxFunding);
  const hasAmountBound = minFunding !== "" || maxFunding !== "";

  return (
    <div
      className={cn("flex flex-col gap-8", isPending && "opacity-70 transition-opacity", className)}
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
          Filters
        </h2>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-2 py-1 text-xs"
            onClick={() => clearAll([...FILTER_PARAM_KEYS.filter((key) => key !== "sort")])}
          >
            Clear All
          </Button>
        )}
      </div>

      <Group label="Application Window">
        <div className="flex flex-col gap-2">
          {WINDOW_ORDER.map((windowKey) => (
            <label key={windowKey} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox
                checked={selectedWindow === windowKey}
                onCheckedChange={(checked) =>
                  setValue("window", checked === true ? windowKey : null)
                }
              />
              {WINDOW_LABELS[windowKey]}
            </label>
          ))}
        </div>
      </Group>

      <Group label="Funding Source">
        <div className="flex flex-col gap-2">
          {SOURCE_ORDER.map((source) => (
            <label key={source} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <Checkbox
                checked={selectedSources.includes(source)}
                onCheckedChange={() => toggleValue("source", source)}
              />
              {FUNDING_SOURCE_LABELS[source]}
            </label>
          ))}
        </div>
      </Group>

      <Group label="Award Ceiling">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="filter-min" className="sr-only">
              Minimum Award
            </Label>
            <Input
              id="filter-min"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Min"
              defaultValue={minFunding}
              className="font-mono text-sm tabular-nums"
              onBlur={(event) => setValue("min", event.target.value)}
            />
          </div>
          <span className="text-xs text-muted-foreground">to</span>
          <div className="flex-1">
            <Label htmlFor="filter-max" className="sr-only">
              Maximum Award
            </Label>
            <Input
              id="filter-max"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Max"
              defaultValue={maxFunding}
              className="font-mono text-sm tabular-nums"
              onBlur={(event) => setValue("max", event.target.value)}
            />
          </div>
        </div>

        {/* Said plainly, because otherwise results vanish for no visible reason. */}
        {hasAmountBound && (
          <p className="mt-3 flex gap-2 text-xs leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Grants that have not published an amount are hidden while this is set.
          </p>
        )}
      </Group>

      {categories.length > 0 && (
        <Group label="Category">
          <div className="flex flex-col gap-2">
            {categories.map((category) => (
              <label
                key={category.slug}
                className="flex cursor-pointer items-center gap-2.5 text-sm"
              >
                <Checkbox
                  checked={selectedCategories.includes(category.slug)}
                  onCheckedChange={() => toggleValue("category", category.slug)}
                />
                <span className="flex-1">{category.name}</span>
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {category.grantCount}
                </span>
              </label>
            ))}
          </div>
        </Group>
      )}
    </div>
  );
}

function Group({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-semibold">{label}</legend>
      {children}
    </fieldset>
  );
}
