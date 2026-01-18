-- Create client_configs table for per-client customization
CREATE TABLE public.client_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  competitors TEXT[] DEFAULT '{}',
  website_url TEXT,
  linkedin_organization_id TEXT,
  hubspot_portal_id TEXT,
  google_analytics_property_id TEXT,
  industry TEXT DEFAULT 'technology',
  market_news_keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- Enable Row Level Security
ALTER TABLE public.client_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching clients table pattern)
CREATE POLICY "Allow public read access to client_configs" 
ON public.client_configs 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert access to client_configs" 
ON public.client_configs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update access to client_configs" 
ON public.client_configs 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete access to client_configs" 
ON public.client_configs 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_client_configs_updated_at
BEFORE UPDATE ON public.client_configs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();