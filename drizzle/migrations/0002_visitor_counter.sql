CREATE TABLE public.visitors (
  id uuid PRIMARY KEY,
  first_seen timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.visitors TO anon, authenticated;
GRANT ALL ON public.visitors TO service_role;

ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visitor count"
  ON public.visitors FOR SELECT
  USING (true);

CREATE POLICY "Anyone can record own visit"
  ON public.visitors FOR INSERT
  WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.record_visit(p_visitor_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.visitors (id)
  VALUES (p_visitor_id)
  ON CONFLICT (id) DO NOTHING;

  SELECT count(*)::int FROM public.visitors;
$$;

REVOKE ALL ON FUNCTION public.record_visit(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_visit(uuid) TO anon, authenticated;