"use client";

import { Search, X } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedSearch } from "@/features/shared/hooks/use-debounced-search";
import { cn } from "@/lib/utils";

interface GrantSearchFieldProps {
  readonly initialValue: string;
  /** The page's current query string, so searching preserves active filters. */
  readonly currentQuery?: string;
  readonly className?: string;
}

/**
 * Keyword search over titles, summaries and eligibility text.
 *
 * The term lives in the URL, so a search is shareable, indexable and survives
 * a refresh. Typing rewrites the URL after a pause rather than on submit —
 * the form still submits on Enter for anyone who expects that.
 *
 * The debounce itself lives in `useDebouncedSearch`, shared with the admin
 * listings so every search in the product behaves the same way.
 */
export function GrantSearchField({
  initialValue,
  currentQuery = "",
  className,
}: GrantSearchFieldProps) {
  const { value, setValue, commit, clear, isPending } = useDebouncedSearch(
    currentQuery,
    initialValue,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(event) => {
        event.preventDefault();
        commit(value);
      }}
    >
      <label htmlFor="grant-search" className="sr-only">
        Search grants
      </label>

      <Search
        className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />

      <Input
        id="grant-search"
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search by keyword, agency or technology"
        className="h-12 pr-12 pl-11 text-base"
        autoComplete="off"
      />

      {value !== "" && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Clear search"
          className="absolute top-1/2 right-2 size-8 -translate-y-1/2"
          onClick={() => {
            clear();
            inputRef.current?.focus();
          }}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      )}

      <span aria-live="polite" className="sr-only">
        {isPending ? "Searching" : ""}
      </span>
    </form>
  );
}
