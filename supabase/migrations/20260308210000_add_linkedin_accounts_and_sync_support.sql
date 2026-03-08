-- LinkedIn accounts mapping + contents metadata + sync helpers

CREATE TABLE IF NOT EXISTS public.linkedin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id TEXT NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  linkedin_account_id TEXT NOT NULL UNIQUE,
  linkedin_page_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.linkedin_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access to linkedin_accounts" ON public.linkedin_accounts;
DROP POLICY IF EXISTS "Allow public insert access to linkedin_accounts" ON public.linkedin_accounts;
DROP POLICY IF EXISTS "Allow public update access to linkedin_accounts" ON public.linkedin_accounts;
CREATE POLICY "Allow public read access to linkedin_accounts"
ON public.linkedin_accounts FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to linkedin_accounts"
ON public.linkedin_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to linkedin_accounts"
ON public.linkedin_accounts FOR UPDATE USING (true);

ALTER TABLE public.contents
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

WITH ranked AS (
  SELECT
    id,
    source_url,
    ROW_NUMBER() OVER (PARTITION BY source_url ORDER BY created_at DESC, id DESC) AS rn
  FROM public.contents
  WHERE source_url IS NOT NULL
)
DELETE FROM public.contents c
USING ranked r
WHERE c.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contents_source_url
  ON public.contents(source_url)
  WHERE source_url IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_content_metrics_content_measured
  ON public.content_metrics(content_id, measured_at);

WITH seed_rows(client_name, account_id, page_name) AS (
  VALUES
    ('DigiObs', '27018734', 'DigiObs'),
    ('Adechotech', '15216486', 'AdEchoTech'),
    ('Spark Lasers', '11332395', 'SPARK LASERS'),
    ('Amarok', '2774822', 'Amarok Biotechnologies'),
    ('Board4care', '107427813', 'BOARD4CARE'),
    ('Nerya', '18798523', 'Nerya'),
    ('Huck Occitania', '26003071', 'Huck # Occitania'),
    ('AlibeeZ', '9216560', 'AlibeeZ'),
    ('Alsbom', '6577101', 'ALSBOM'),
    ('Agro-Bio', '2421879', 'Agro-Bio Antibodies'),
    ('Veinsound', '11146603', 'Veinsound'),
    ('Mabsilico', '18152652', 'MAbSilico'),
    ('Centaur Clinical', '25496043', 'Centaur Clinical CRO'),
    ('Apmonia Therapeutics', '20288888', 'Apmonia Therapeutics'),
    ('Amont', '98013143', 'AMONT'),
    ('Bioseb', '103563524', 'Biiime')
)
INSERT INTO public.linkedin_accounts (client_id, linkedin_account_id, linkedin_page_name)
SELECT c.id, s.account_id, s.page_name
FROM seed_rows s
JOIN public.clients c ON lower(c.name) = lower(s.client_name)
ON CONFLICT (linkedin_account_id) DO UPDATE
SET
  client_id = EXCLUDED.client_id,
  linkedin_page_name = EXCLUDED.linkedin_page_name;

DO $$
BEGIN
  IF to_regprocedure('cron.schedule(text,text,text)') IS NOT NULL
     AND to_regprocedure('net.http_post(text,jsonb,jsonb,jsonb,integer)') IS NOT NULL THEN
    -- Safe attempt: schedule only if pg_cron + pg_net are available
    BEGIN
      PERFORM cron.unschedule('fetch-linkedin-posts');
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;

    PERFORM cron.schedule(
      'fetch-linkedin-posts',
      '0 6 * * *',
      $job$select net.http_post(
        url := current_setting('app.settings.supabase_url', true) || '/functions/v1/fetch-linkedin-posts',
        headers := jsonb_build_object(
          'Content-Type', 'application/json'
        ),
        body := '{}'::jsonb
      )$job$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Skipping cron creation for fetch-linkedin-posts: %', SQLERRM;
END $$;

