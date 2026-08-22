"use client";

import { Search, X } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedSearch } from "@/features/shared/hooks/use-debounced-search";
import { cn } from "@/lib/utils";

interface AdminSearchFieldProps {
  readonly initialValue: string;
  /** The page's current query string, so searching preserves other filters. */
  readonly currentQuery?: string;
  readonly placeholder?: string;
  readonly label: string;
  readonly className?: string;
}

/**
 * Search for an admin listing.
 *
 * Same debounce as the public search, different shape — an operator scanning a
 * list of 148 agencies wants a compact control, not the hero field from the
 * landing page. What they share is the behaviour: results narrow as you stop
 * typing, with no button to press.
 *
 * Replacing a submit button with live search is the point. Typing a name and
 * then having to find and click "Search" is the slow half of the interaction,
 * and the one people forget, leaving them looking at an unfiltered list
 * wondering why their search did nothing.
 */
export function AdminSearchField({
  initialValue,
  currentQuery = "",
  placeholder = "Search",
  label,
  className,
}: AdminSearchFieldProps) {
  const { value, setValue, commit, clear, isPending } = useDebouncedSearch(
    currentQuery,
    initialValue,
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const id = `admin-search-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <form
      role="search"
      className={cn("relative w-full max-w-sm", className)}
      onSubmit={(event) => {
        // Enter still works for anyone who expects a form to submit, it just
        // is not required any more.
        event.preventDefault();
        commit(value);
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <Search
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />

      <Input
        id={id}
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="h-9 pr-9 pl-9 text-sm"
        autoComplete="off"
      />

      {value !== "" && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Clear search"
          className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
          onClick={() => {
            clear();
            inputRef.current?.focus();
          }}
        >
          <X className="size-3.5" aria-hidden="true" />
        </Button>
      )}

      <span aria-live="polite" className="sr-only">
        {isPending ? "Searching" : ""}
      </span>
    </form>
  );
}
