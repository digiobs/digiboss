# DigiObs Tenant Isolation Checklist

Use this checklist before releasing integration or analytics features.

## Database / RLS

- [ ] Target table has RLS enabled.
- [ ] Read policy restricts rows to expected scope (or explicitly documented public read).
- [ ] Write policy is service-role only for ingestion tables.
- [ ] New tables are visible in `security_rls_audit`.

## Ingestion Functions

- [ ] Function resolves `client_id` through `client_data_mappings`.
- [ ] No write is performed without a mapped `client_id`.
- [ ] Integration run is logged in `integration_sync_runs`.
- [ ] Errors include safe diagnostics but no secrets.

## Frontend Data Access

- [ ] Query applies selected client filter by default.
- [ ] All-clients mode is explicit and intentional.
- [ ] Admin-only views are not reused in client-facing tabs.

## AI Workflows

- [ ] Prompt input contains only tenant-scoped data.
- [ ] Output is stored with `client_id`.
- [ ] Prompt/output metadata is auditable via integration run logs.

## Release Gate

- [ ] CI green (`lint`, `typecheck`, `build`, `smoke:functions`).
- [ ] Migration order validated on staging.
- [ ] Manual smoke test done on one single-client and all-clients scenario.
