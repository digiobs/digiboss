-- Extend creative_proposals for the production workflow
-- (validation -> Wrike task creation -> ready to publish -> published)

ALTER TABLE creative_proposals
  ADD COLUMN IF NOT EXISTS wrike_task_id text,
  ADD COLUMN IF NOT EXISTS wrike_permalink text,
  ADD COLUMN IF NOT EXISTS ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_at timestamptz;

COMMENT ON COLUMN creative_proposals.wrike_task_id IS
  'ID of the Wrike task created when the proposal is validated (status=approved)';
COMMENT ON COLUMN creative_proposals.wrike_permalink IS
  'Permalink to open the Wrike task directly';
COMMENT ON COLUMN creative_proposals.ready_at IS
  'Timestamp when the proposal moved to status=ready_to_publish';
COMMENT ON COLUMN creative_proposals.published_at IS
  'Timestamp when the proposal moved to status=published';

-- Index to quickly look up proposals by their linked Wrike task
-- (used by the reverse sync path and by the UI to detect duplicates).
CREATE INDEX IF NOT EXISTS creative_proposals_wrike_task_id_idx
  ON creative_proposals (wrike_task_id)
  WHERE wrike_task_id IS NOT NULL;
