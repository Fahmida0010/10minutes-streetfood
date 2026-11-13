DROP POLICY IF EXISTS "Anyone can record own visit" ON public.visitors;
DROP POLICY IF EXISTS "Anyone can view visitor count" ON public.visitors;
DROP POLICY IF EXISTS "Anyone can read restaurant images" ON storage.objects;

CREATE POLICY "Owners can read own restaurant images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'restaurant-images'
  AND (storage.foldername(name))[1] = (select auth.uid()::text)
);