"use client";

import { SearchField } from "@/components/shared/search-field";
import { useDebouncedSearch } from "@/features/shared/hooks/use-debounced-search";
import { cn } from "@/lib/utils";

/**
 * Search for an admin listing.
 *
 * The same control as the public one — same shell, same leading icon, same
 * clear button, same debounce — rendered at the `sm` step of the scale. An
 * operator scanning 148 agencies is looking at a toolbar above a table, not a
 * landing page, so the field is dense; it is the identical control at a
 * different size rather than a second design.
 *
 * No submit button, and that is the one deliberate difference. Live filtering
 * *is* the interaction here: typing a name and then having to find and click
 * "Search" is the slow half, and the half people forget, leaving them looking
 * at an unfiltered list wondering why nothing happened. Enter still submits
 * for anyone who expects it to.
 */
export function AdminSearchField({
  initialValue,
  currentQuery = "",
  placeholder = "Search",
  label,
  className,
}: {
  readonly initialValue: string;
  /** The page's current query string, so searching preserves other filters. */
  readonly currentQuery?: string;
  readonly placeholder?: string;
  readonly label: string;
  readonly className?: string;
}) {
  const { value, setValue, commit, clear, isPending } = useDebouncedSearch(
    currentQuery,
    initialValue,
  );

  return (
    <SearchField
      // Derived from the label so two listings on one page cannot collide on
      // the id the <label> points at.
      id={`admin-search-${label.toLowerCase().replace(/\s+/g, "-")}`}
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={setValue}
      onSubmit={() => commit(value)}
      onClear={clear}
      isPending={isPending}
      size="sm"
      className={cn("w-full max-w-sm", className)}
    />
  );
}
