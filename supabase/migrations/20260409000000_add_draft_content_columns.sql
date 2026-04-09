-- Add draft_content column to creative_proposals for full post/article draft text
ALTER TABLE creative_proposals ADD COLUMN IF NOT EXISTS draft_content text;

-- Add draft_content column to editorial_calendar for full draft content
ALTER TABLE editorial_calendar ADD COLUMN IF NOT EXISTS draft_content text;

-- Comment for documentation
COMMENT ON COLUMN creative_proposals.draft_content IS 'Full draft text of the post/article, extracted from HTML pipeline documents';
COMMENT ON COLUMN editorial_calendar.draft_content IS 'Full draft text of the planned publication';
