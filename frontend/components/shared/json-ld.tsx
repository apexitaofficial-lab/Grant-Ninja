import type { JsonLdObject } from "@/features/seo/lib/json-ld";

interface JsonLdProps {
  /** Nulls are accepted and skipped, so callers can pass conditional schemas. */
  readonly schemas: readonly (JsonLdObject | null)[];
}

/**
 * Renders structured data server-side.
 *
 * `<` is escaped because a value containing `</script>` would otherwise close
 * the tag early and let arbitrary markup into the page — grant text comes from
 * crawled government pages, so it is not trusted input.
 */
export function JsonLd({ schemas }: JsonLdProps) {
  const present = schemas.filter((schema): schema is JsonLdObject => schema !== null);

  if (present.length === 0) {
    return null;
  }

  return (
    <>
      {present.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
          }}
        />
      ))}
    </>
  );
}
