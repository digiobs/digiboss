-- Lemlist funnel metrics + authenticated RLS
--
-- The /prospects refonte drops the fake fit/intent/engagement scoring and
-- reads real lemlist funnel counters directly from lemlist_contacts_cache.
-- This migration:
--   1. Adds the funnel columns populated by supabase/functions/lemlist-sync.
--   2. Indexes (client_id, campaign_id) for the table filter on /prospects.
--   3. Mirrors the RLS pattern we added to tldv_meetings earlier today so the
--      authenticated role can actually read rows (admin sees all, client-scoped
--      users see only their assigned client_ids). service_role_all stays.

ALTER TABLE public.lemlist_contacts_cache
  ADD COLUMN IF NOT EXISTS campaign_id        TEXT,
  ADD COLUMN IF NOT EXISTS campaign_name      TEXT,
  ADD COLUMN IF NOT EXISTS emails_sent        INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS emails_opened      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS emails_clicked     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS emails_replied     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_step       INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_event_type    TEXT,
  ADD COLUMN IF NOT EXISTS last_event_at      TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS lemlist_contacts_cache_client_campaign_idx
  ON public.lemlist_contacts_cache (client_id, campaign_id);

-- Admin has full CRUD on lemlist_contacts_cache
DROP POLICY IF EXISTS admin_full_access ON public.lemlist_contacts_cache;
CREATE POLICY admin_full_access ON public.lemlist_contacts_cache
  FOR ALL
  TO authenticated
  USING (is_digiobs_admin())
  WITH CHECK (is_digiobs_admin());

-- Client-scoped team members can read cached contacts for their assigned
-- clients. Both lemlist_contacts_cache.client_id and user_client_ids() are
-- text, so no cast is needed.
DROP POLICY IF EXISTS client_read_own ON public.lemlist_contacts_cache;
CREATE POLICY client_read_own ON public.lemlist_contacts_cache
  FOR SELECT
  TO authenticated
  USING (client_id IN (SELECT user_client_ids()));
