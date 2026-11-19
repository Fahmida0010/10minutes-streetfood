ALTER TABLE public.visitors
  ADD COLUMN visit_count bigint NOT NULL DEFAULT 0;

-- Every existing visitor has visited at least once.
UPDATE public.visitors SET visit_count = 1 WHERE visit_count = 0;

CREATE OR REPLACE FUNCTION public.record_visit(p_visitor_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.visitors (id, visit_count)
  VALUES (p_visitor_id, 1)
  ON CONFLICT (id) DO UPDATE
    SET visit_count = visitors.visit_count + 1;

  RETURN (SELECT count(*)::integer FROM public.visitors);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_visit_stats(p_visitor_id uuid)
RETURNS TABLE (unique_visitors bigint, total_visits bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.visitors (id, visit_count)
  VALUES (p_visitor_id, 1)
  ON CONFLICT (id) DO UPDATE
    SET visit_count = visitors.visit_count + 1;

  RETURN QUERY
    SELECT count(*)::bigint, COALESCE(sum(v.visit_count), 0)::bigint
    FROM public.visitors AS v;
END;
$$;

REVOKE ALL ON FUNCTION public.record_visit(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_visit_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_visit(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_visit_stats(uuid) TO anon, authenticated;