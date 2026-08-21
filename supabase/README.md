# Database

PostgreSQL schema for Grant Ninja, shared by the Next.js app and the Python
pipeline. Design rationale lives in [`docs/DATABASE_ARCHITECTURE.md`](../docs/DATABASE_ARCHITECTURE.md).

## Applying the migrations

The project ref is `irgrblwctfsfiwlxxwby`, already linked. All 15 migrations
are applied.

```bash
npx supabase db push
```

Four separate credentials exist, and confusing them is the usual cause of a
failed push:

| Credential | Format | Used by |
| ---------- | ------ | ------- |
| Publishable key | `sb_publishable_…` | Browser, through PostgREST |
| Secret key | `sb_secret_…` | Server and Python pipeline; bypasses RLS |
| Access token | `sbp_…` | The CLI. Account-level, from Account → Access Tokens |
| Database password | — | `supabase link`. Project Settings → Database |

The CLI needs the **access token** and the **database password**. It will not
accept either API key.

## Bootstrapping the first administrator

New accounts are created `inactive` with the `viewer` role, so signing up
grants nothing on its own. Promote the first administrator by hand, once:

```sql
update public.admin_users
   set role = 'super_admin', status = 'active'
 where email = 'you@example.com';
```

Everyone after that is managed from the admin UI.

## Generating TypeScript types

Run this after every schema change. `frontend/types/database.ts` is generated
output — it is excluded from ESLint and Prettier, and must never be hand-edited.

```bash
npx supabase gen types typescript --linked --schema public > frontend/types/database.ts
```

## Order

| File | Contents |
| ---- | -------- |
| `0001_extensions_and_enums` | pgcrypto, pg_trgm, unaccent; 14 enum types |
| `0002_shared_functions` | touch_updated_at, polymorphic guards, slugify |
| `0003_geography` | countries, states |
| `0004_organizations` | organizations + organization_count trigger |
| `0005_categories_and_tags` | grant_categories (hierarchical), grant_tags |
| `0006_grants` | grants, check constraints, generated tsvector, 12 indexes |
| `0007_grant_relations` | category/tag joins, documents, sources, count triggers |
| `0008_ai_content_and_faq` | grant_ai_content, answer capsules, polymorphic faq_items |
| `0009_versions_and_history` | grant_versions, grant_history, ai_generation_logs |
| `0010_seo` | seo_metadata, schema_markup, same_as_profiles, seo_redirects |
| `0011_crawler` | sources, queue, pages, runs, duplicate_detection |
| `0012_platform` | admin_users, system_settings, audit_logs, contact, media |
| `0013_rls_policies` | role helpers, RLS on all 30 tables, three tiers |
| `0014_seed` | countries, categories, sameAs profiles, settings, static FAQs |
| `0015_grants_and_privileges` | table GRANTs; new accounts start inactive |

## Things worth knowing before editing

**RLS and GRANTs are two separate locks, and you need both.** RLS decides which
rows a role sees; the GRANT decides whether it may touch the table at all.
Tables created by a migration are owned by `postgres` and carry no grants, so a
new table is unreachable — `42501 permission denied` — until it is added to
`0015`. That error means a missing GRANT, never a missing policy.

**RLS is on for every table.** A table with RLS enabled and no policy denies
everything to `anon` and `authenticated`. Adding a table without adding a
policy makes it invisible rather than public, which is the failure mode you
want.

**Three access tiers.** Anonymous visitors read published content only. Admin
capability is gated by `admin_users.role` through `is_admin_at_least()`. The
crawler tables, version history and audit log have no write policy at all —
only the secret key writes there, and history cannot be rewritten through the
API.

**Counters are recomputed, not incremented.** `grant_count` triggers recount
the affected rows rather than applying a delta, so a concurrent write or a
manual SQL fix cannot leave a counter permanently skewed.

**Three tables are polymorphic** — `faq_items`, `seo_metadata`,
`schema_markup`. They cannot carry real foreign keys, so a `BEFORE` trigger
verifies the parent exists and an `AFTER DELETE` trigger on each parent clears
orphans. If you add a new parent entity type, add its cleanup trigger too.

**`slugify()` is STABLE, not IMMUTABLE**, because `unaccent()` is. Do not use
it in an index expression.
