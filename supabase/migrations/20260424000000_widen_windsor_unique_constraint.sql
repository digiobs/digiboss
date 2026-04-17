-- Widen the unique constraint: Windsor data has multiple rows per
-- (date, datasource, campaign) distinguished by account_name and source.
-- The 3-column Windsor "Columns to Match" handles upsert logic on their side;
-- the DB constraint must accept all distinct rows.

ALTER TABLE public.windsor_campaign_metrics
  DROP CONSTRAINT IF EXISTS windsor_campaign_metrics_date_datasource_campaign_key;

ALTER TABLE public.windsor_campaign_metrics
  DROP CONSTRAINT IF EXISTS windsor_campaign_metrics_datasource_date_campaign_post_id_key;

ALTER TABLE public.windsor_campaign_metrics
  ADD CONSTRAINT windsor_campaign_metrics_unique_row
  UNIQUE (date, datasource, campaign, account_name, source);
