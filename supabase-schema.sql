-- Supabase Schema for 3D Digital Aquarium (Already applied to your 'digital-aquarium' project!)

CREATE TABLE IF NOT EXISTS public.aquarium_fishes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) <= 40),
  species text NOT NULL CHECK (char_length(species) BETWEEN 1 AND 32 AND species ~ '^[a-z0-9_-]+$'),
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
    AND char_length(species) BETWEEN 1 AND 32
    AND species ~ '^[a-z0-9_-]+$'
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

-- PIN-Protected Admin Reset & Single Fish Delete RPC Functions (Default PIN: '1234')
CREATE OR REPLACE FUNCTION public.reset_aquarium(admin_pin text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  IF admin_pin IS DISTINCT FROM '1234' THEN
    RAISE EXCEPTION 'Invalid Admin PIN';
  END IF;

  DELETE FROM public.aquarium_fishes WHERE true;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_aquarium_fish(target_id uuid, admin_pin text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF admin_pin IS DISTINCT FROM '1234' THEN
    RAISE EXCEPTION 'Invalid Admin PIN';
  END IF;

  DELETE FROM public.aquarium_fishes WHERE id = target_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_aquarium(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_aquarium_fish(uuid, text) TO anon, authenticated;
