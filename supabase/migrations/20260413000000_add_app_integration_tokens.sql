-- App-level OAuth token store. One row per provider (global connection
-- that serves every client). Used by the Wrike OAuth2 flow so admins
-- can connect Wrike directly from /settings/integrations instead of
-- depending on a WRIKE_ACCESS_TOKEN environment variable.

CREATE TABLE IF NOT EXISTS app_integration_tokens (
  provider text PRIMARY KEY,
  access_token text NOT NULL,
  refresh_token text,
  token_type text DEFAULT 'bearer',
  api_host text,
  expires_at timestamptz,
  scope text,
  metadata jsonb DEFAULT '{}'::jsonb,
  connected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE app_integration_tokens IS
  'Global OAuth tokens per provider (one row = one connected integration for the whole app).';
COMMENT ON COLUMN app_integration_tokens.api_host IS
  'API host returned by the provider at token exchange time (e.g. www.wrike.com for Wrike EU/US).';
COMMENT ON COLUMN app_integration_tokens.expires_at IS
  'Access token expiry. The edge function helper refreshes proactively ~60s before this timestamp.';

-- Short-lived state store for OAuth2 CSRF protection.
CREATE TABLE IF NOT EXISTS app_integration_oauth_states (
  state text PRIMARY KEY,
  provider text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redirect_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes')
);

CREATE INDEX IF NOT EXISTS app_integration_oauth_states_expires_idx
  ON app_integration_oauth_states (expires_at);

ALTER TABLE app_integration_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_integration_oauth_states ENABLE ROW LEVEL SECURITY;

-- Only the service role needs to read the raw tokens. The frontend reads
-- a sanitised status view (defined below) that omits the secrets.
DROP POLICY IF EXISTS "service_role_all_tokens" ON app_integration_tokens;
CREATE POLICY "service_role_all_tokens"
  ON app_integration_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_states" ON app_integration_oauth_states;
CREATE POLICY "service_role_all_states"
  ON app_integration_oauth_states
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Public-ish view for the UI: tells you which providers are connected
-- without ever leaking the access / refresh tokens.
CREATE OR REPLACE VIEW app_integration_status AS
SELECT
  provider,
  api_host,
  expires_at,
  scope,
  metadata,
  connected_by,
  connected_at,
  updated_at,
  (expires_at IS NULL OR expires_at > now()) AS is_active
FROM app_integration_tokens;

GRANT SELECT ON app_integration_status TO authenticated;
