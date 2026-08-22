"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { GrantSort } from "@/features/grants/types/grant";
import { useQueryParams } from "@/features/shared/hooks/use-query-params";

interface GrantSortSelectProps {
  readonly value: GrantSort;
  readonly labels: Readonly<Record<GrantSort, string>>;
  /** The page's current query string, so sorting preserves active filters. */
  readonly currentQuery: string;
}

/**
 * Sort order lives in the URL so a sorted listing can be shared and indexed.
 * Pagination reset is handled by the shared hook, not repeated here.
 */
export function GrantSortSelect({ value, labels, currentQuery }: GrantSortSelectProps) {
  const { setValue, isPending } = useQueryParams(currentQuery);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="grant-sort" className="text-xs text-muted-foreground">
        Sort by
      </label>
      <Select value={value} onValueChange={(next) => setValue("sort", next)}>
        <SelectTrigger id="grant-sort" size="sm" className="w-[190px]" disabled={isPending}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(labels).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
