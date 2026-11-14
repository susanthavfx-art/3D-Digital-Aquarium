-- Supabase Schema for 3D Digital Aquarium (Already applied to your 'digital-aquarium' project!)

CREATE TABLE IF NOT EXISTS public.aquarium_fishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) <= 40),
  species text NOT NULL CHECK (species IN ('clownfish', 'angelfish', 'turtle', 'jellyfish', 'starfish')),
  texture_url text NOT NULL,
  swim_seed integer NOT NULL DEFAULT floor(random() * 100000)::int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aquarium_fishes_created_at
  ON public.aquarium_fishes (created_at DESC);

ALTER TABLE public.aquarium_fishes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read fishes"
  ON public.aquarium_fishes FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public insert fishes"
  ON public.aquarium_fishes FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(name) <= 40
    AND species IN ('clownfish', 'angelfish', 'turtle', 'jellyfish', 'starfish')
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.aquarium_fishes;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('fish-textures', 'fish-textures', true, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Public view fish textures"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'fish-textures');

CREATE POLICY "Public upload fish textures"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'fish-textures');
