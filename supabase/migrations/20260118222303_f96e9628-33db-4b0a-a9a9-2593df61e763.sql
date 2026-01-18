-- Create a table to cache Perplexity news results
CREATE TABLE public.news_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  articles JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create index for faster lookups
CREATE INDEX idx_news_cache_key ON public.news_cache(cache_key);
CREATE INDEX idx_news_cache_expires ON public.news_cache(expires_at);

-- Enable RLS (public read for edge functions, no direct user access needed)
ALTER TABLE public.news_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage cache (edge functions use service role)
CREATE POLICY "Service role can manage cache"
ON public.news_cache
FOR ALL
USING (true)
WITH CHECK (true);