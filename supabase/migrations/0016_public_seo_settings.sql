-- 0016_public_seo_settings
--
-- robots.txt and llms.txt are published files. Gating the settings that
-- generate them behind the secret key protects nothing — anyone can read the
-- output by requesting the file — and it would force the public site to use an
-- admin client for an ordinary page render.
--
-- Marking them public keeps every public-page read on the publishable key.

update public.system_settings
   set is_public = true
 where key in ('robots_allow_indexing', 'robots_disallow_paths', 'llms_txt');
