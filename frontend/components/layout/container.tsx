import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ContainerProps {
  readonly children: ReactNode;
  readonly className?: string;
  /** Defaults to `div`; pass `section`/`header`/`footer` to keep markup semantic (§88). */
  readonly as?: ElementType;
}

/**
 * The single horizontal rhythm for the whole site — 1280px content width with
 * 16/24/32px padding (UI_UX_DESIGN_SYSTEM.md §6, MASTER_PROJECT_SPEC.md §37).
 * No page should set its own max-width.
 */
export function Container({ children, className, as: Component = "div" }: ContainerProps) {
  return (
    <Component className={cn("mx-auto w-full max-w-[1280px] px-4 md:px-6 lg:px-8", className)}>
      {children}
    </Component>
  );
}
