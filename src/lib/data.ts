import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type Deal = Database["public"]["Tables"]["deals"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];

export const restaurantsQuery = queryOptions({
  queryKey: ["restaurants"],
  queryFn: async () => {
    const [r, d, rv] = await Promise.all([
      supabase.from("restaurants").select("*").order("name"),
      supabase.from("deals").select("*").gt("ends_at", new Date().toISOString()),
      supabase.from("reviews").select("restaurant_id, rating"),
    ]);
    if (r.error) throw r.error;
    const ratings: Record<string, { sum: number; n: number }> = {};
    for (const x of rv.data ?? []) {
      const e = (ratings[x.restaurant_id] ??= { sum: 0, n: 0 });
      e.sum += x.rating;
      e.n += 1;
    }
    return { restaurants: r.data ?? [], deals: d.data ?? [], ratings };
  },
});

export const restaurantQuery = (id: string) =>
  queryOptions({
    queryKey: ["restaurant", id],
    queryFn: async () => {
      const [r, m, d, rv] = await Promise.all([
        supabase.from("restaurants").select("*").eq("id", id).maybeSingle(),
        supabase.from("menu_items").select("*").eq("restaurant_id", id).order("price"),
        supabase.from("deals").select("*").eq("restaurant_id", id).order("ends_at"),
        supabase
          .from("reviews")
          .select("*")
          .eq("restaurant_id", id)
          .order("created_at", { ascending: false }),
      ]);
      if (r.error) throw r.error;
      return {
        restaurant: r.data,
        menu: m.data ?? [],
        deals: d.data ?? [],
        reviews: rv.data ?? [],
      };
    },
  });

export function displayName(r: Restaurant, lang: "en" | "bn") {
  return lang === "bn" && r.name_bn ? r.name_bn : r.name;
}
