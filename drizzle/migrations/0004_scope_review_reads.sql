DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "View reviews of listed places" ON public.reviews FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.restaurants r WHERE r.id = reviews.restaurant_id AND r.available = true) OR auth.uid() = user_id);
REVOKE SELECT ON public.reviews FROM anon;
GRANT SELECT (id, restaurant_id, user_name, rating, comment, created_at) ON public.reviews TO anon;