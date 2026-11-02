import { supabase } from "@/integrations/supabase/client";

const KEY = "10m-visitor-id";

/** Records this device once (unique visitor id in localStorage) and returns the total unique visitor count. */
export async function recordVisit(): Promise<number | null> {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    const { data, error } = await supabase.rpc("record_visit", { p_visitor_id: id });
    if (error || data == null) return null;
    return Number(data);
  } catch {
    return null;
  }
}

export function bnDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);
}
