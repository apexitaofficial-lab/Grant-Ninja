import { z } from "zod";

/**
 * Validated on both sides, per AI_ENGINEERING_GUIDE.md. The page limit is
 * capped here as well as in the database: a manual crawl of 500 pages is
 * hundreds of AI calls, and an accidental extra zero should be refused by the
 * form rather than discovered on the bill.
 */
export const requestCrawlSchema = z.object({
  sourceId: z.string().uuid("Choose a source to crawl."),
  pageLimit: z.coerce
    .number()
    .int("Pages must be a whole number.")
    .min(1, "Crawl at least one page.")
    .max(100, "Keep a manual crawl to 100 pages or fewer."),
});

export type RequestCrawlInput = z.infer<typeof requestCrawlSchema>;
