DROP POLICY IF EXISTS "subjects readable" ON public.subjects;
CREATE POLICY "subjects readable by signed-in" ON public.subjects FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "periods readable" ON public.periods;
CREATE POLICY "periods readable by signed-in" ON public.periods FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);
REVOKE SELECT ON public.subjects, public.periods FROM anon;