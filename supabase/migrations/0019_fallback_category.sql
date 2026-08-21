-- 0019_fallback_category
--
-- A catch-all category, and the setting that names it.
--
-- The database refuses to publish a grant without a category, which is the
-- right rule — an uncategorised grant is unbrowsable and invisible to every
-- filter on the site. But the ten seeded categories were chosen before we had
-- seen the live federal feed, and it is full of victim services, foreign
-- assistance and public health. Every crawled grant was therefore correct,
-- confident, and stuck in the review queue for want of a label.
--
-- "Others" resolves that: a grant nothing else fits still reaches the site and
-- stays findable by agency, deadline and search while a better category is
-- decided.
--
-- The trade-off is real and worth stating. A catch-all becomes a dumping
-- ground if nobody watches it, and a large "Others" is a signal the taxonomy
-- needs extending, not that the fallback is working. `sort_order` 999 keeps it
-- last everywhere it is listed.

insert into public.grant_categories (name, slug, description, icon, color, sort_order)
values (
  'Others',
  'others',
  'Grants that do not yet fit another category. Browse by agency or deadline, '
  'or use search, while these are being classified.',
  'Shapes',
  'brand',
  999
)
on conflict (slug) do nothing;

-- Named in settings rather than hardcoded in the pipeline, so the fallback can
-- be repointed at a better category from the admin panel without a deploy —
-- the same rule the auto-publish threshold follows (decision D3).
insert into public.system_settings (key, value, group_name, description, is_public)
values (
  'fallback_category_slug',
  '"others"'::jsonb,
  'ai',
  'Category assigned when no other matches, so a grant is never blocked from '
  'publication by classification alone. Empty disables the fallback and sends '
  'unmatched grants to review instead.',
  false
)
on conflict (key) do nothing;
