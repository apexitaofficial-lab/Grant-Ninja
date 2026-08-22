"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useQueryParams } from "@/features/shared/hooks/use-query-params";

/**
 * A search box that writes to the URL after the typing stops.
 *
 * Every search in the product goes through this. Without a delay, each
 * keystroke is its own navigation and its own database query: typing
 * "manufacturing" is thirteen round trips, twelve of whose results are thrown
 * away before anyone reads them. Worse, they can land out of order — the reply
 * for "manu" arriving after the reply for "manufact" leaves the list showing
 * results for a word the person has finished typing past.
 *
 * The term stays in the query string rather than in component state, so a
 * search is shareable, survives a refresh, and comes back correctly on the
 * back button.
 */

/**
 * 350ms. Long enough that ordinary typing produces one query rather than one
 * per letter, short enough that a pause still feels like a live response.
 * Below roughly 200ms the debounce stops paying for itself; past about 500ms
 * it reads as lag.
 */
export const SEARCH_DEBOUNCE_MS = 350;

export interface UseDebouncedSearchOptions {
  /** The query-string key to write. */
  readonly key?: string;
  readonly delayMs?: number;
}

export interface DebouncedSearch {
  /** What the input shows — updates on every keystroke. */
  readonly value: string;
  readonly setValue: (next: string) => void;
  /** Writes immediately, skipping the delay. For Enter and the clear button. */
  readonly commit: (next: string) => void;
  readonly clear: () => void;
  /** True while the navigation triggered by a search is in flight. */
  readonly isPending: boolean;
}

export function useDebouncedSearch(
  currentQuery: string,
  initialValue: string,
  options: UseDebouncedSearchOptions = {},
): DebouncedSearch {
  const { key = "q", delayMs = SEARCH_DEBOUNCE_MS } = options;
  const { setValue: setParam, isPending } = useQueryParams(currentQuery);
  const [value, setValue] = useState(initialValue);

  // Tracks what has actually been written to the URL. Without it, a pending
  // timer fires after the URL has already caught up and pushes a duplicate
  // navigation — harmless but visible as an extra history entry.
  const lastCommitted = useRef(initialValue);

  // The URL is the source of truth. A back navigation, or a filter change that
  // rewrites the query string, must win over whatever is in local state.
  useEffect(() => {
    setValue(initialValue);
    lastCommitted.current = initialValue;
  }, [initialValue]);

  const commit = useCallback(
    (next: string) => {
      const trimmed = next.trim();

      if (trimmed === lastCommitted.current) {
        return;
      }

      lastCommitted.current = trimmed;
      setParam(key, trimmed);
    },
    [key, setParam],
  );

  useEffect(() => {
    if (value.trim() === lastCommitted.current) {
      return;
    }

    const timer = setTimeout(() => commit(value), delayMs);

    // Clearing on every change is what makes this a debounce rather than a
    // throttle: the clock restarts while the person is still typing, so the
    // query fires once, when they stop.
    return () => clearTimeout(timer);
  }, [value, delayMs, commit]);

  const clear = useCallback(() => {
    setValue("");
    commit("");
  }, [commit]);

  return { value, setValue, commit, clear, isPending };
}
