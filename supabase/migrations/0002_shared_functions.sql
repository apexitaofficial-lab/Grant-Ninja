-- 0002_shared_functions
-- Trigger functions reused across the schema.
-- DATABASE_ARCHITECTURE.md §6.

-- ---------------------------------------------------------------------------
-- touch_updated_at
--
-- Attached to every table carrying updated_at. Kept in the database rather
-- than the application so a hand-written fix from the Supabase dashboard
-- cannot leave a stale timestamp behind.
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- enforce_polymorphic_parent
--
-- faq_items, seo_metadata and schema_markup attach to several entity types, so
-- they cannot carry a real foreign key. This verifies the referenced row
-- exists on write; a matching cleanup trigger removes orphans on parent delete.
--
-- Arg 0: name of the entity_type column.
-- Arg 1: name of the entity_id column.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_polymorphic_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_type_column text := tg_argv[0];
  v_id_column   text := tg_argv[1];
  v_entity_type text;
  v_entity_id   uuid;
  v_table       text;
  v_exists      boolean;
begin
  execute format('select ($1).%I::text, ($1).%I', v_type_column, v_id_column)
    into v_entity_type, v_entity_id
    using new;

  -- Static pages legitimately have no parent row.
  if v_entity_id is null then
    return new;
  end if;

  v_table := case v_entity_type
    when 'grant'        then 'grants'
    when 'country'      then 'countries'
    when 'state'        then 'states'
    when 'category'     then 'grant_categories'
    when 'organization' then 'organizations'
    else null
  end;

  if v_table is null then
    raise exception
      'entity_type % must not carry an entity_id', v_entity_type
      using errcode = 'check_violation';
  end if;

  execute format('select exists (select 1 from public.%I where id = $1)', v_table)
    into v_exists
    using v_entity_id;

  if not v_exists then
    raise exception
      'referenced % % does not exist', v_entity_type, v_entity_id
      using errcode = 'foreign_key_violation';
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- cleanup_polymorphic_children
--
-- Attached AFTER DELETE on each parent. Removes polymorphic rows that would
-- otherwise be orphaned, standing in for the ON DELETE CASCADE a real foreign
-- key would have given us.
--
-- Arg 0: the entity_type literal for this parent.
-- ---------------------------------------------------------------------------
create or replace function public.cleanup_polymorphic_children()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entity_type text := tg_argv[0];
begin
  delete from public.faq_items
   where entity_type::text = v_entity_type and entity_id = old.id;

  delete from public.seo_metadata
   where entity_type::text = v_entity_type and entity_id = old.id;

  delete from public.schema_markup
   where entity_type::text = v_entity_type and entity_id = old.id;

  return old;
end;
$$;

-- ---------------------------------------------------------------------------
-- slugify
--
-- Used by the seed migration and available to the admin layer. Application
-- code still owns collision resolution (country suffix, then organization,
-- then a short hash) because that needs context this function does not have.
-- ---------------------------------------------------------------------------
-- STABLE, not IMMUTABLE: unaccent() depends on a dictionary and is itself only
-- STABLE, so slugify must not be used in an index expression.
create or replace function public.slugify(p_input text)
returns text
language sql
stable
strict
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(lower(extensions.unaccent(p_input)), '[^a-z0-9]+', '-', 'g'),
      '-{2,}', '-', 'g'
    )
  );
$$;
