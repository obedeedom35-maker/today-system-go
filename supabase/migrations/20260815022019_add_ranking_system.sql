-- Add ranking columns to profiles
ALTER TABLE public.profiles 
  ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN score INTEGER NOT NULL DEFAULT 0;

-- Create policy to allow reading public profiles
-- We use a dedicated policy so anyone authenticated can see the public profiles
CREATE POLICY "public profiles readable" ON public.profiles 
  FOR SELECT TO authenticated 
  USING (is_public = true);

-- Create a view for easy access to the ranking
CREATE OR REPLACE VIEW public.user_rankings AS
SELECT 
  id, 
  full_name, 
  institution, 
  course, 
  period_number, 
  score
FROM public.profiles
WHERE is_public = true
ORDER BY score DESC;

-- Grant permissions on the view
GRANT SELECT ON public.user_rankings TO authenticated;
