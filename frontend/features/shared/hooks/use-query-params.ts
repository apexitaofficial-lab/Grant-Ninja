"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";

/**
 * One way to write listing state into the URL.
 *
 * Sort, search and every filter live in the query string so a view can be
 * shared, bookmarked, indexed and restored by the back button. Three controls
 * writing to the same URL by three different routines would eventually
 * disagree about pagination resets, so they all come through here.
 *
 * The current query arrives as a prop rather than from `useSearchParams()`.
 * That hook forces the component into a client-render bail-out: Next wraps it
 * in a Suspense boundary whose content is streamed separately, and if that
 * boundary fails to resolve the control renders but never hydrates — a dead
 * page with no error anywhere. The server has already parsed the query string,
 * so passing it down avoids the whole mechanism.
 */
export function useQueryParams(currentQuery: string) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const apply = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(currentQuery);

      mutate(params);

      // Any change to what is being shown invalidates the page number: page 4
      // of the old result set is meaningless in the new one.
      params.delete("page");

      startTransition(() => {
        const query = params.toString();

        // The full pathname, not a bare `?query`: a query-only href is not
        // reliably resolved by the App Router.
        router.push(query === "" ? pathname : `${pathname}?${query}`, { scroll: false });
      });
    },
    [router, pathname, currentQuery],
  );

  const setValue = useCallback(
    (key: string, value: string | null) => {
      apply((params) => {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
    },
    [apply],
  );

  /** Repeated keys rather than a delimiter, so values containing commas survive. */
  const setValues = useCallback(
    (key: string, values: readonly string[]) => {
      apply((params) => {
        params.delete(key);
        values.forEach((value) => params.append(key, value));
      });
    },
    [apply],
  );

  const toggleValue = useCallback(
    (key: string, value: string) => {
      const current = new URLSearchParams(currentQuery).getAll(key);
      const next = current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value];

      setValues(key, next);
    },
    [currentQuery, setValues],
  );

  const clearAll = useCallback(
    (keys: readonly string[]) => {
      apply((params) => keys.forEach((key) => params.delete(key)));
    },
    [apply],
  );

  return { isPending, setValue, setValues, toggleValue, clearAll };
}
