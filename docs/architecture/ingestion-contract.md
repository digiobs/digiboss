# DigiObs Ingestion Contract

This document defines the normalized ingestion lifecycle for all DigiObs providers.

## Lifecycle

Each connector must implement the same five stages:

1. `fetch`: retrieve source data from provider APIs.
2. `normalize`: validate and shape payloads into DigiObs internal types.
3. `map_client`: resolve `client_id` through `client_data_mappings`.
4. `upsert`: persist transformed rows into warehouse tables.
5. `sync_log`: write execution status and metrics in `integration_sync_runs`.

## Required run metadata

Each run must persist:

- `provider` and `connector`
- `client_id` (nullable for global runs)
- `trigger_type` (`manual` / `scheduled` / `webhook`)
- `status` (`running` / `success` / `partial` / `failed`)
- `started_at`, `completed_at`
- `metrics` (`recordsFetched`, `recordsUpserted`, `recordsFailed`, `durationMs`)
- `error_message` and `error_details` when applicable
- optional `sample_payload`

## Failure handling

- External API failures must set run status to `failed`.
- Partial upsert failures must set run status to `partial`.
- Never throw without first attempting to update `integration_sync_runs`.

## Mapping policy

Connectors must resolve external ownership through `client_data_mappings`:

- strict match by `provider + connector + external_account_id`
- fallback to alias strategy if configured
- manual override always takes precedence

## Implementation reference

- Shared helper: `supabase/functions/_shared/ingestion.ts`
- Example connectors:
  - `supabase/functions/tldv-sync-transcripts/index.ts`
  - `supabase/functions/market-news/index.ts`
