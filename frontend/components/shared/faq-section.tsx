import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/features/shared/repositories/faq-repository";
import { cn } from "@/lib/utils";

interface FaqSectionProps {
  readonly items: readonly FaqItem[];
  readonly headingId?: string;
  readonly className?: string;
}

/**
 * Questions rendered as real text, not lazily-loaded panels.
 *
 * The accordion collapses the *visual* answer but every answer stays in the
 * DOM, which is what lets a search engine or an assistant quote it. This is
 * the whole point of the FAQ blocks on a grant page.
 */
export function FaqSection({ items, headingId = "faq", className }: FaqSectionProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={headingId} className={cn(className)}>
      <h2
        id={headingId}
        className="border-b border-border pb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase"
      >
        Frequently asked questions
      </h2>

      <Accordion type="multiple" className="mt-2">
        {items.map((item) => (
          <AccordionItem key={item.question} value={item.question}>
            <AccordionTrigger className="text-left text-base font-semibold">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="leading-relaxed text-muted-foreground">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
