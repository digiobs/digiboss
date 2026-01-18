-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- For now, allow public read/write access (can be restricted later with auth)
CREATE POLICY "Allow public read access to clients"
ON public.clients
FOR SELECT
USING (true);

CREATE POLICY "Allow public insert access to clients"
ON public.clients
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public update access to clients"
ON public.clients
FOR UPDATE
USING (true);

CREATE POLICY "Allow public delete access to clients"
ON public.clients
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_clients_updated_at
BEFORE UPDATE ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial DigiObs clients
INSERT INTO public.clients (name, color) VALUES
  ('Adechotech', 'red'),
  ('Agro-Bio', 'orange'),
  ('AlibeeZ', 'yellow'),
  ('Alsbom', 'green'),
  ('Amarok', 'blue'),
  ('Amont', 'purple'),
  ('Apmonia Therapeutics', 'pink'),
  ('Bioseb', 'cyan'),
  ('BlueSpine', 'blue'),
  ('Board4care', 'green'),
  ('Centaur Clinical', 'purple'),
  ('DigiObs', 'blue'),
  ('Huck Occitania', 'orange'),
  ('IMV Technologies', 'cyan'),
  ('Kaptory', 'pink'),
  ('Mabsilico', 'purple'),
  ('Nerya', 'green'),
  ('Spark Lasers', 'red'),
  ('SRA Instruments', 'blue'),
  ('Veinsound', 'orange');