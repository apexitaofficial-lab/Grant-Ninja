"use client";

import { Search, X } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Every search box on the site.
 *
 * This holds no behaviour — it does not know what a grant is, where a term
 * goes, or whether typing filters a list or navigates to one. Callers own all
 * of that and pass in a value and three callbacks. What lives here is the
 * *appearance*: the shell, the leading icon, the controls inside the field and
 * the spacing between them.
 *
 * It exists because there were two copies of this markup — the public field
 * and the admin one — and they had drifted apart on nine separate values:
 * icon inset, icon gap, input padding, text size, clear-button size, its
 * offset, the icon inside it, the field height and how the label id was built.
 * None of that was decided twice on purpose; it was decided once and then
 * copied and nudged. One component means the next nudge lands everywhere.
 *
 * Sizes are a scale, not two unrelated designs. Every value below moves
 * together, so `sm` reads as the same control as `lg` rather than a different
 * one that happens to also be a search box.
 */

export type SearchFieldSize = "sm" | "lg";

interface SizeTokens {
  readonly input: string;
  readonly icon: string;
  readonly paddingLeft: string;
  /** Right padding, by which controls are actually inside the field. */
  readonly paddingRight: {
    readonly none: string;
    readonly clear: string;
    readonly submit: string;
    readonly both: string;
  };
  readonly controls: string;
  readonly clearButton: string;
  readonly clearIcon: string;
  readonly submitSize: "sm" | "lg";
}

const SIZES: Readonly<Record<SearchFieldSize, SizeTokens>> = {
  /** Admin toolbars: a dense control that sits above a table. */
  sm: {
    input: "h-9 text-sm",
    icon: "left-3 size-4",
    paddingLeft: "pl-9",
    paddingRight: { none: "pr-3", clear: "pr-9", submit: "pr-20", both: "pr-28" },
    controls: "right-1 gap-1",
    clearButton: "size-7",
    clearIcon: "size-3.5",
    submitSize: "sm",
  },
  /** The public site: the field is the primary thing on the page. */
  lg: {
    input: "h-12 text-base",
    icon: "left-4 size-4",
    paddingLeft: "pl-11",
    paddingRight: { none: "pr-4", clear: "pr-12", submit: "pr-24", both: "pr-32" },
    controls: "right-1.5 gap-1",
    clearButton: "size-8",
    clearIcon: "size-4",
    submitSize: "lg",
  },
};

interface SearchFieldProps {
  /** Unique on the page — the label points at it. */
  readonly id: string;
  /** Read out instead of the placeholder, which assistive tech may not announce. */
  readonly label: string;
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly onSubmit: () => void;
  readonly onClear: () => void;
  /** True while the navigation a search triggered is in flight. */
  readonly isPending: boolean;
  readonly size?: SearchFieldSize;
  /** Renders a submit button when set. Omit where submitting is not the action. */
  readonly submitLabel?: string;
  readonly className?: string;
}

export function SearchField({
  id,
  label,
  placeholder,
  value,
  onChange,
  onSubmit,
  onClear,
  isPending,
  size = "lg",
  submitLabel,
  className,
}: SearchFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const tokens = SIZES[size];

  const hasClear = value !== "";
  const hasSubmit = submitLabel !== undefined;

  // Padding has to clear whatever is actually rendered. Deriving it from the
  // same condition that renders the controls is what stops placeholder text
  // sliding underneath a button as soon as someone types.
  const paddingRight = hasSubmit
    ? hasClear
      ? tokens.paddingRight.both
      : tokens.paddingRight.submit
    : hasClear
      ? tokens.paddingRight.clear
      : tokens.paddingRight.none;

  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(event) => {
        // Enter works everywhere, whether or not a button is rendered.
        event.preventDefault();
        onSubmit();
      }}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <Search
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted-foreground",
          tokens.icon,
        )}
        aria-hidden="true"
      />

      <Input
        id={id}
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          tokens.input,
          tokens.paddingLeft,
          paddingRight,
          // Chrome draws its own clear button inside `type="search"`, which
          // sits next to ours and gives the field two X icons that do the same
          // thing at different sizes. Ours stays: it is the one that restores
          // focus, and the one that matches the rest of the site.
          "[&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden",
        )}
        autoComplete="off"
      />

      {/*
        Both controls in one flex row rather than each pinned to the right
        edge. Positioning them independently means the two of them collide the
        moment a field has a submit button and someone types into it.
      */}
      {(hasClear || hasSubmit) && (
        <div className={cn("absolute top-1/2 flex -translate-y-1/2 items-center", tokens.controls)}>
          {hasClear && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Clear search"
              className={tokens.clearButton}
              onClick={() => {
                onClear();
                // Clearing is a step in searching, not the end of it — the
                // cursor belongs back in the field.
                inputRef.current?.focus();
              }}
            >
              <X className={tokens.clearIcon} aria-hidden="true" />
            </Button>
          )}

          {hasSubmit && (
            <Button type="submit" size={tokens.submitSize}>
              {submitLabel}
            </Button>
          )}
        </div>
      )}

      <span aria-live="polite" className="sr-only">
        {isPending ? "Searching" : ""}
      </span>
    </form>
  );
}
