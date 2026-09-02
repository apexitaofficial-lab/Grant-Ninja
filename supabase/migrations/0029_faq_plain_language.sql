-- 0029_faq_plain_language
--
-- "Automated crawlers" -> "Automated systems" in the home page FAQ.
--
-- The answer to "How often is the grants database updated?" described the
-- pipeline in the pipeline's own vocabulary. A crawler is the correct word for
-- what `python/adapters/` does, and it is the wrong word to put in front of
-- someone deciding whether to trust the data: it names the mechanism where the
-- question was about reliability, and it reads as jargon to anyone who has not
-- built one.
--
-- "Systems" rather than "tools" because the claim is about standing
-- infrastructure that keeps a database current, not about something a person
-- picks up and uses.
--
-- ---------------------------------------------------------------------------
-- Why a migration for one sentence of copy
-- ---------------------------------------------------------------------------
-- There is no admin screen for FAQs. `/admin` covers agencies, categories,
-- countries, the crawler, duplicates, grants, messages and settings, but
-- `faq_items` has no editor — so editorial copy that appears on the home page
-- can only be changed by someone with database access. Until that screen
-- exists, a migration is the only way for this edit to be reviewed, tracked,
-- and to survive a restore or a re-seed.
--
-- Matched on the exact prior text rather than the id alone, so this cannot
-- overwrite a later hand-edit: if someone has already reworded the answer, the
-- statement matches nothing and does nothing. That also makes it re-runnable.

update public.faq_items
   set answer = 'The database is refreshed continuously. Automated systems check official government sources on a daily schedule, and every grant record shows its last verified date.'
 where id = '9044aa21-f0a6-4e8d-911a-757f96aae7e0'
   and answer = 'The database is refreshed continuously. Automated crawlers check official government sources on a daily schedule, and every grant record shows its last verified date.';

-- ---------------------------------------------------------------------------
-- Left alone deliberately
-- ---------------------------------------------------------------------------
-- The answer still says the database is "refreshed continuously" and then "on
-- a daily schedule". Those disagree, and the second one is right:
-- `crawler_sources.crawl_frequency` defaults to '0 2 * * *', a single run a
-- day. Correcting it is a content decision rather than a wording fix, so it is
-- not bundled in here — it was raised separately.
