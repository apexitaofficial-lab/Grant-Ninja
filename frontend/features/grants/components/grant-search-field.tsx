"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQueryParams } from "@/features/grants/hooks/use-query-params";
import { cn } from "@/lib/utils";

interface GrantSearchFieldProps {
  readonly initialValue: string;
  /** The page's current query string, so searching preserves active filters. */
  readonly currentQuery?: string;
  readonly className?: string;
}

/** Long enough to avoid a query on every keystroke, short enough to feel live. */
const DEBOUNCE_MS = 350;

/**
 * Keyword search over titles, summaries and eligibility text.
 *
 * The term lives in the URL, so a search is shareable, indexable and survives
 * a refresh. Typing rewrites the URL after a pause rather than on submit —
 * the form still submits on Enter for anyone who expects that.
 */
export function GrantSearchField({
  initialValue,
  currentQuery = "",
  className,
}: GrantSearchFieldProps) {
  const { setValue: setParam, isPending } = useQueryParams(currentQuery);
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // The URL is the source of truth: a back navigation must win over local state.
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  function commit(next: string) {
    setParam("q", next.trim());
  }

  useEffect(() => {
    if (value === initialValue) {
      return;
    }

    const timer = setTimeout(() => setParam("q", value.trim()), DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value, initialValue, setParam]);

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
            setValue("");
            commit("");
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
