import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { categoryImage } from "@/lib/geo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "My places — 10MinitesStreetfood" },
      { name: "description", content: "Manage your restaurant listing, menu, prices and deals." },
      { property: "og:title", content: "My places — 10MinitesStreetfood" },
      { property: "og:description", content: "Manage your restaurant listing, menu, prices and deals." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["my-places", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("restaurants").select("*").eq("owner_id", user!.id).order("created_at")).data ?? [],
  });
  return (
    <main className="mx-auto max-w-4xl px-3 py-6 sm:px-4 sm:py-10">
      <div className="grid min-w-0 grid-cols-1 items-start gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold sm:text-3xl">My places</h1>
          <p className="text-muted-foreground">Keep your menu, prices and hours fresh so visitors pick you.</p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/dashboard/$id" params={{ id: "new" }}>
            <Plus /> Add place
          </Link>
        </Button>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {data?.map((r) => (
          <Link
            key={r.id}
            to="/dashboard/$id"
            params={{ id: r.id }}
            className="overflow-hidden rounded-2xl border bg-card shadow-card transition hover:shadow-pop"
          >
            <img src={r.image_url || categoryImage(r.category)} alt={r.name} loading="lazy" className="h-36 w-full object-cover" />
            <div className="p-4">
              <h3 className="break-words text-lg font-bold">{r.name}</h3>
              <p className="text-sm text-muted-foreground">
                {r.area} · {r.available ? "Open today" : "Closed today"}
              </p>
            </div>
          </Link>
        ))}
        {data?.length === 0 && (
          <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground sm:col-span-2">
            No places yet. Add your restaurant, hotel or street stall — it goes live instantly.
          </p>
        )}
      </div>
    </main>
  );
}
