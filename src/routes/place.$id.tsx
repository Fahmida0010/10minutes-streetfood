import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Clock, Footprints, Heart, MapPin, Navigation, Phone, Star } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/use-auth";
import { restaurantQuery, displayName } from "@/lib/data";
import { supabase } from "@/integrations/supabase/client";
import {
  categoryImage,
  dhakaMinutesNow,
  distanceMeters,
  formatDistance,
  formatTime,
  isOpenAt,
  walkMinutes,
  type LatLng,
} from "@/lib/geo";
import { FoodMap } from "@/components/FoodMap";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/place/$id")({
  head: () => ({
    meta: [
      { title: "Place details — 10MinitesStreetfood" },
      { name: "description", content: "Menu with prices, opening hours, walking route and reviews." },
      { property: "og:title", content: "Place details — 10MinitesStreetfood" },
      { property: "og:description", content: "Menu with prices, opening hours, walking route and reviews." },
    ],
  }),
  component: PlacePage,
});

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(500),
});

function PlacePage() {
  const { id } = Route.useParams();
  const { t, lang, location, favs, toggleFav } = useApp();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(restaurantQuery(id));
  const [route, setRoute] = useState<LatLng[] | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ m: number; min: number } | null>(null);
  const [routing, setRouting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [posting, setPosting] = useState(false);

  if (isLoading) return <div className="mx-auto max-w-5xl p-8 text-muted-foreground">…</div>;
  const r = data?.restaurant;
  if (!r) return <div className="mx-auto max-w-5xl p-8">Not found</div>;

  const meters = distanceMeters(location, [r.lat, r.lng]);
  const open = r.available && isOpenAt(r.open_time, r.close_time, dhakaMinutesNow());
  const avg = data.reviews.length ? data.reviews.reduce((s, x) => s + x.rating, 0) / data.reviews.length : 0;
  const deals = data.deals.filter((d) => new Date(d.ends_at) > new Date());

  async function showRoute() {
    setRouting(true);
    try {
      const url = `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${location[1]},${location[0]};${r!.lng},${r!.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const j = await res.json();
      const rt = j.routes?.[0];
      if (!rt) throw new Error("no route");
      setRoute(rt.geometry.coordinates.map(([lng, lat]: [number, number]) => [lat, lng]));
      setRouteInfo({ m: rt.distance, min: Math.max(1, Math.round(rt.distance / 80)) });
    } catch {
      toast.error("Route not available right now");
    } finally {
      setRouting(false);
    }
  }

  async function postReview() {
    if (!user) return;
    const parsed = reviewSchema.safeParse({ rating, comment });
    if (!parsed.success) { toast.error("Review is too long"); return; }
    setPosting(true);
    const { error } = await supabase.from("reviews").insert({
      restaurant_id: id,
      user_id: user.id,
      user_name: (user.user_metadata?.["full_name"] as string) || user.email?.split("@")[0] || "Guest",
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    setComment("");
    qc.invalidateQueries({ queryKey: ["restaurant", id] });
    qc.invalidateQueries({ queryKey: ["restaurants"] });
  }

  return (
    <main className="mx-auto max-w-6xl px-3 py-4 sm:px-4 sm:py-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> {t("back")}
      </Link>

      <div className="mt-4 grid min-w-0 gap-5 sm:gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <img
            src={r.image_url || categoryImage(r.category)}
            alt={r.name}
            width={944}
            height={704}
            className="aspect-[16/10] w-full rounded-2xl object-cover shadow-card sm:rounded-3xl"
          />
          <div className="mt-5 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-medium uppercase tracking-wide text-muted-foreground">
                {t(r.category as "restaurant")} · {r.area} {r.halal && `· ${t("halal")}`}
              </p>
              <h1 className="break-words text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">{displayName(r, lang)}</h1>
              {avg > 0 && (
                <p className="mt-1 inline-flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 fill-accent text-accent" /> {avg.toFixed(1)} ({data.reviews.length})
                </p>
              )}
            </div>
            <button onClick={() => toggleFav(r.id)} className="rounded-full border bg-card p-3" aria-label="Save">
              <Heart className={`h-5 w-5 ${favs.includes(r.id) ? "fill-destructive text-destructive" : ""}`} />
            </button>
          </div>
          {r.description && <p className="mt-3 text-lg text-muted-foreground">{r.description}</p>}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Info icon={<Footprints />} label={t("minWalk")} value={`${walkMinutes(meters)} min`} />
            <Info icon={<MapPin />} label="Distance" value={formatDistance(meters)} />
            <Info
              icon={<Clock />}
              label={!r.available ? t("unavailable") : open ? t("open") : t("closed")}
              value={`${formatTime(r.open_time)} – ${formatTime(r.close_time)}`}
            />
            <Info icon={<span>৳</span>} label={t("priceRange")} value={`৳${r.price_min}–${r.price_max}`} />
          </div>

          {deals.length > 0 && (
            <div className="mt-6 space-y-2">
              {deals.map((d) => (
                <p key={d.id} className="rounded-2xl bg-accent p-4 font-display font-bold text-accent-foreground">
                  🔥 {d.title}
                </p>
              ))}
            </div>
          )}

          <h2 className="mt-8 text-2xl font-bold">{t("menu")}</h2>
          <ul className="mt-3 divide-y overflow-hidden rounded-2xl border bg-card">
            {data.menu.map((m) => (
              <li key={m.id} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 px-3 py-3 sm:px-4">
                <span className={m.available ? "" : "text-muted-foreground line-through"}>{m.name}</span>
                <span className="font-semibold">
                  {m.available ? `৳${m.price}` : <span className="text-sm text-destructive">{t("soldOut")}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <FoodMap
            className="h-80 w-full overflow-hidden rounded-3xl border shadow-card"
            center={[r.lat, r.lng]}
            user={location}
            pins={[{ id: r.id, lat: r.lat, lng: r.lng, label: r.name, category: r.category }]}
            route={route ?? undefined}
            zoom={16}
          />
          {routeInfo && (
            <p className="rounded-2xl bg-primary p-4 text-primary-foreground">
              <strong className="font-display text-2xl">{routeInfo.min} min</strong> · {formatDistance(routeInfo.m)}{" "}
              {t("walkingRoute").toLowerCase()}
            </p>
          )}
          <div className="grid gap-2">
            <Button size="lg" onClick={showRoute} disabled={routing} className="rounded-full">
              <Footprints /> {routing ? t("routeLoading") : t("showRoute")}
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-full">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}&travelmode=walking`}
                target="_blank"
                rel="noreferrer"
              >
                <Navigation /> {t("openGoogle")}
              </a>
            </Button>
            {r.phone && (
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <a href={`tel:${r.phone}`}>
                  <Phone /> {t("call")} {r.phone}
                </a>
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            <MapPin className="mr-1 inline h-4 w-4" />
            {r.address}
          </p>

          <div className="rounded-3xl border bg-card p-5">
            <h2 className="text-xl font-bold">{t("reviews")}</h2>
            {user ? (
              <div className="mt-3 space-y-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`}>
                      <Star className={`h-6 w-6 ${n <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                    </button>
                  ))}
                </div>
                <Textarea value={comment} maxLength={500} onChange={(e) => setComment(e.target.value)} placeholder={t("writeReview")} />
                <Button onClick={postReview} disabled={posting}>
                  {t("submit")}
                </Button>
              </div>
            ) : (
              <Button asChild variant="outline" className="mt-3">
                <Link to="/auth">{t("signInToReview")}</Link>
              </Button>
            )}
            <ul className="mt-4 space-y-3">
              {data.reviews.length === 0 && <li className="text-sm text-muted-foreground">{t("noReviews")}</li>}
              {data.reviews.map((rv) => (
                <li key={rv.id} className="border-t pt-3">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {rv.user_name}
                    <span className="text-accent">{"★".repeat(rv.rating)}</span>
                  </p>
                  {rv.comment && <p className="text-sm text-muted-foreground">{rv.comment}</p>}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-card p-3">
      <div className="text-primary [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
