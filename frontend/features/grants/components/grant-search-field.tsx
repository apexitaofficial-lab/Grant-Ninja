"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SearchField } from "@/components/shared/search-field";
import { useDebouncedSearch } from "@/features/shared/hooks/use-debounced-search";

/**
 * Keyword search over titles, summaries and eligibility text.
 *
 * The field has two jobs, and they are not the same interaction:
 *
 * **Filtering** — on the listing itself, the term is written to the current URL
 * as you type and the results below update in place. The URL is the state, so
 * a search is shareable, indexable and survives the back button.
 *
 * **Navigating** — anywhere else, there are no results underneath to update,
 * so the field is a way *into* the listing. It waits for a submit and then
 * goes there.
 *
 * Which one you get is decided by `destination`. Debouncing the navigating
 * form would be actively hostile: the push would fire mid-word, unmount the
 * input under the cursor and drop focus while someone was still typing.
 *
 * Both look identical — same shell, same size, same controls, from
 * `components/shared/search-field.tsx`. The difference is what a submit does,
 * and a visitor moving between the home page and the listing should not be
 * able to see the seam.
 */

const PLACEHOLDER = "Search by keyword, agency or technology";
const SUBMIT_LABEL = "Search";

interface GrantSearchFieldProps {
  readonly initialValue: string;
  /** The page's current query string, so searching preserves active filters. */
  readonly currentQuery?: string;
  /**
   * Where a search should land. Omit it on a page that lists grants, so the
   * field filters what is already on screen; pass a path anywhere else.
   */
  readonly destination?: string;
  readonly className?: string;
}

export function GrantSearchField({
  initialValue,
  currentQuery = "",
  destination,
  className,
}: GrantSearchFieldProps) {
  return destination === undefined ? (
    <FilteringSearchField
      initialValue={initialValue}
      currentQuery={currentQuery}
      className={className}
    />
  ) : (
    <NavigatingSearchField
      initialValue={initialValue}
      destination={destination}
      className={className}
    />
  );
}

/**
 * Filters the listing it sits on.
 *
 * Typing rewrites the URL after a pause; the debounce lives in
 * `useDebouncedSearch`, shared with the admin listings so every search in the
 * product behaves the same way. Submitting commits the term immediately rather
 * than waiting out the remainder of that pause — which is what the Search
 * button is for here, and why it is not merely decorative on a field that
 * already updates by itself.
 */
function FilteringSearchField({
  initialValue,
  currentQuery,
  className,
}: {
  readonly initialValue: string;
  readonly currentQuery: string;
  readonly className?: string;
}) {
  const { value, setValue, commit, clear, isPending } = useDebouncedSearch(
    currentQuery,
    initialValue,
  );

  return (
    <SearchField
      id="grant-search"
      label="Search grants"
      placeholder={PLACEHOLDER}
      value={value}
      onChange={setValue}
      onSubmit={() => commit(value)}
      // Clearing here has a visible consequence — the results reset.
      onClear={clear}
      isPending={isPending}
      submitLabel={SUBMIT_LABEL}
      className={className}
    />
  );
}

/**
 * Takes the visitor to the listing, with their term applied.
 *
 * Submit-only, which is what makes Enter the thing that works. An empty
 * submit still goes to the listing: someone who presses Search with nothing
 * typed is asking to see what there is, and a form that silently does nothing
 * is the complaint this exists to answer.
 */
function NavigatingSearchField({
  initialValue,
  destination,
  className,
}: {
  readonly initialValue: string;
  readonly destination: string;
  readonly className?: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  return (
    <SearchField
      id="grant-search"
      label="Search grants"
      placeholder={PLACEHOLDER}
      value={value}
      onChange={setValue}
      onSubmit={() => {
        const term = value.trim();

        startTransition(() => {
          router.push(term === "" ? destination : `${destination}?q=${encodeURIComponent(term)}`);
        });
      }}
      // Nothing has been committed anywhere yet, so this only empties the box.
      onClear={() => setValue("")}
      isPending={isPending}
      submitLabel={SUBMIT_LABEL}
      className={className}
    />
  );
}
