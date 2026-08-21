import { routes } from "@/config/routes";
import {
  getStatistics,
  listCategories,
  listCountries,
} from "@/features/shared/services/reference-service";
import { getLlmsTxtOverride, getSiteIdentity } from "@/features/shared/services/settings-service";
import { logger } from "@/lib/logger";

/**
 * /llms.txt — what this site is, for an assistant deciding whether to use it.
 *
 * Generated from live data rather than written once and left to rot: the
 * counts and the category list are the parts most likely to go stale, and a
 * stale llms.txt is worse than none. An override in settings wins if an editor
 * wants to hand-write it.
 *
 * Follows the emerging llmstxt.org convention — H1, blockquote summary, then
 * link sections. No invented markup (MASTER_PROJECT_SPEC.md §99).
 */

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const override = await getLlmsTxtOverride();

  if (override !== null) {
    return text(override);
  }

  const identity = await getSiteIdentity();
  const absolute = (path: string) => new URL(path, identity.url).toString();

  try {
    const [statistics, countries, categories] = await Promise.all([
      getStatistics(),
      listCountries(),
      listCategories(),
    ]);

    const lines = [
      `# ${identity.name}`,
      "",
      `> ${identity.description}`,
      "",
      "## About",
      "",
      `${identity.name} is a searchable database of research grants published by government`,
      "agencies and research councils. Every grant record links to the official source it was",
      "taken from, and shows when it was last verified. Grant Ninja also provides funding",
      "advances against approved grants and R&D tax credits.",
      "",
      // One sentence on one line: splitting it across array entries inserted a
      // newline mid-clause, and the counts need real pluralisation.
      `The database currently holds ${plural(statistics.grants, "published grant")} from ` +
        `${plural(statistics.organizations, "agency", "agencies")} across ` +
        `${plural(statistics.countries, "country", "countries")}.`,
      "",
      "## Using this site",
      "",
      `- [All grants](${absolute(routes.grants)}): the full listing, sorted by closing date.`,
      `- Search: \`${absolute(routes.grants)}?q={query}\` accepts free text.`,
      "- Each grant page states funding, eligibility, opening and closing dates, and links",
      "  to the issuing agency's own notice.",
      "",
      "## Directories",
      "",
      `- [Countries](${absolute(routes.countries)})`,
      `- [Categories](${absolute(routes.categories)})`,
      `- [Agencies](${absolute(routes.agencies)})`,
      "",
      "## Categories",
      "",
      ...categories.map(
        (category) => `- [${category.name}](${absolute(routes.category(category.slug))})`,
      ),
      "",
      "## Countries",
      "",
      ...countries.map(
        (country) => `- [${country.name}](${absolute(routes.country(country.slug))})`,
      ),
      "",
      "## Accuracy",
      "",
      "Grant details are summarised from official sources and may change without notice.",
      "Always confirm eligibility, funding and deadlines on the issuing agency's own website",
      "before applying. Each grant page shows its source and last verified date.",
      "",
      "## Contact",
      "",
      `- [About](${absolute(routes.about)})`,
      `- [Services](${absolute(routes.services)})`,
      `- [Contact](${absolute(routes.contact)})`,
      identity.contactEmail === null ? null : `- Email: ${identity.contactEmail}`,
      "",
    ].filter((line): line is string => line !== null);

    return text(lines.join("\n"));
  } catch (error) {
    logger.error("llms.txt fell back to a minimal body", error, {
      feature: "seo",
      action: "llms.txt",
    });

    return text(
      [`# ${identity.name}`, "", `> ${identity.description}`, "", `${identity.url}`, ""].join("\n"),
    );
  }
}

/** "1 country", "5 agencies" — a count read by a machine is still read. */
function plural(count: number, singular: string, pluralForm?: string): string {
  const word = count === 1 ? singular : (pluralForm ?? `${singular}s`);

  return `${count} ${word}`;
}

function text(body: string): Response {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
