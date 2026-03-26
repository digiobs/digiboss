DROP INDEX IF EXISTS public.idx_contents_source_url;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contents_source_url
  ON public.contents(source_url);

