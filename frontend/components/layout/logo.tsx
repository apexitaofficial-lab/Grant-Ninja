import Image from "next/image";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface LogoProps {
  readonly className?: string;
  /** Rendered height in pixels. Width is derived from the source aspect ratio. */
  readonly height?: number;
  /** Set on the header logo so the LCP image is not lazy-loaded. */
  readonly priority?: boolean;
}

/**
 * Intrinsic size of public/logo-wordmark.png.
 *
 * That file is a trimmed derivative of the supplied `Logo.png`, which is a
 * 4500x5625 canvas roughly 85% white padding — rendering it directly would
 * make the mark illegible at header size. The original is kept untouched as
 * the print-quality source.
 */
const SOURCE_WIDTH = 1200;
const SOURCE_HEIGHT = 411;

/**
 * The brand wordmark. The asset already contains the "Grant Ninja" text, so
 * the alt text carries the name and no separate label is rendered.
 *
 * Swapping the file in `public/` is the only change needed to rebrand — every
 * surface imports this component.
 */
export function Logo({ className, height = 32, priority = false }: LogoProps) {
  const width = Math.round((height * SOURCE_WIDTH) / SOURCE_HEIGHT);

  return (
    <Image
      src="/logo-wordmark.png"
      alt={siteConfig.name}
      width={width}
      height={height}
      priority={priority}
      className={cn("h-8 w-auto", className)}
    />
  );
}
