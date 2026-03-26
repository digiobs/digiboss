CREATE OR REPLACE VIEW public.security_rls_audit AS
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'r'
  AND n.nspname = 'public'
ORDER BY c.relname;

GRANT SELECT ON public.security_rls_audit TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW public.integration_sync_health AS
SELECT
  provider,
  connector,
  client_id,
  COUNT(*) AS total_runs,
  COUNT(*) FILTER (WHERE status = 'success') AS success_runs,
  COUNT(*) FILTER (WHERE status = 'partial') AS partial_runs,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_runs,
  MAX(started_at) AS last_started_at,
  MAX(completed_at) AS last_completed_at
FROM public.integration_sync_runs
GROUP BY provider, connector, client_id;

GRANT SELECT ON public.integration_sync_health TO anon, authenticated, service_role;
