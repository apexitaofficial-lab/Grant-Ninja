-- 0017_service_role_grants
--
-- The secret key authenticates as `service_role`. That role bypasses Row Level
-- Security, which is easy to mistake for "can do anything" — it still needs
-- ordinary table privileges, and migration 0015 granted it none.
--
-- The symptom is a query that fails with 42501 "permission denied for table",
-- and with `head: true` it fails with an *empty* error body, because a HEAD
-- response carries no payload to explain itself.
--
-- Without this, every write from the Python pipeline would fail the same way.

grant usage on schema public to service_role;

-- service_role is the trusted server identity: the crawler, the AI pipeline and
-- admin maintenance all run as it. Blanket DML is the intent here, unlike the
-- deliberately narrow grants given to anon and authenticated in 0015.
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Future tables too, so adding one does not silently break the pipeline.
-- Applies to objects created by the migration owner, which is how every table
-- in this schema is created.
alter default privileges in schema public
  grant all privileges on tables to service_role;

alter default privileges in schema public
  grant all privileges on sequences to service_role;

alter default privileges in schema public
  grant execute on functions to service_role;
