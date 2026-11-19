import { supabase } from "@/integrations/supabase/client";

const KEY = "10m-visitor-id";

export type VisitStats = {
  visitors: number;
  visits: number;
};

/** Records one visit from this device and returns unique-visitor and total-visit counts. */
export async function recordVisit(): Promise<VisitStats | null> {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    const { data, error } = await supabase.rpc("record_visit_stats", { p_visitor_id: id });
    const stats = data?.[0];
    if (error || !stats) return null;
    return {
      visitors: Number(stats.unique_visitors),
      visits: Number(stats.total_visits),
    };
  } catch {
    return null;
  }
}

export function bnDigits(n: number): string {
  const digits = "০১২৩৪৫৬৭৮৯";
  return String(n).replace(/\d/g, (digit) => digits[Number(digit)] ?? digit);
}
