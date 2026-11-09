import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { LocateFixed, Search, Shuffle, Users } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { useApp } from "@/lib/app-context";
import { restaurantsQuery, displayName } from "@/lib/data";
import { dhakaMinutesNow, distanceMeters, isOpenAt, walkMinutes, NEARBY_MINUTES, WALK_M_PER_MIN, STREET_FACTOR } from "@/lib/geo";
import { FoodMap } from "@/components/FoodMap";
import { PlaceCard } from "@/components/PlaceCard";
import { Button } from "@/components/ui/button";
import { bnDigits, recordVisit } from "@/lib/visitor";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "10MinitesStreetfood — Street food within a 10 minute walk" },
      { name: "description", content: "Map of street food, hotels and restaurants across Bangladesh — starting with Sylhet — with prices, opening hours and walking time." },
      { property: "og:title", content: "10MinitesStreetfood — Street food within a 10 minute walk" },
      { property: "og:description", content: "Find street food near you in Bangladesh with walking routes, prices and deals." },
    ],
  }),
  component: Home,
});

const CATS = ["all", "restaurant", "street_food", "hotel", "cafe"] as const;

function Home() {
  const { t, lang, location, hasRealLocation, locate, locating, favs } = useApp();
  const { data } = useQuery(restaurantsQuery);
  const navigate = useNavigate();
  const [cat, setCat] = useState<(typeof CATS)[number]>("all");
  const [near, setNear] = useState(false);
  const [openNow, setOpenNow] = useState(false);
  const [cheap, setCheap] = useState(false);
  const [halal, setHalal] = useState(false);
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    void recordVisit().then((count) => {
      if (mounted) setVisitorCount(count);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const now = dhakaMinutesNow();
  const rows = useMemo(() => {
    if (!data) return [];
    const dealBy: Record<string, string> = {};
    for (const d of data.deals) dealBy[d.restaurant_id] ??= d.title;
    return data.restaurants
      .map((r) => {
        const meters = distanceMeters(location, [r.lat, r.lng]);
        return {
          r,
          meters,
          minutes: walkMinutes(meters),
          open: r.available && isOpenAt(r.open_time, r.close_time, now),
          deal: dealBy[r.id],
        };
      })
      .filter((x) => cat === "all" || x.r.category === cat)
      .filter((x) => !near || x.minutes <= NEARBY_MINUTES)
      .filter((x) => !openNow || x.open)
      .filter((x) => !cheap || x.r.price_min < 200)
      .filter((x) => !halal || x.r.halal)
      .filter((x) => !onlyFavs || favs.includes(x.r.id))
      .filter((x) => {
        const s = q.trim().toLowerCase();
        return !s || `${x.r.name} ${x.r.name_bn} ${x.r.area} ${x.r.description}`.toLowerCase().includes(s);
      })
      .sort((a, b) => a.meters - b.meters);
  }, [data, location, cat, near, openNow, cheap, halal, onlyFavs, favs, q, now]);

  const surprise = () => {
    const pool = rows.filter((x) => x.open && x.minutes <= NEARBY_MINUTES);
    const pick = (pool.length ? pool : rows)[Math.floor(Math.random() * (pool.length || rows.length))];
    if (pick) navigate({ to: "/place/$id", params: { id: pick.r.id } });
  };

  const chip = (on: boolean, set: (v: boolean) => void, label: string) => (
    <button
      onClick={() => set(!on)}
      className={`whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium transition ${on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}
    >
      {label}
    </button>
  );

  return (
    <main>
      <section className="relative overflow-hidden">
        <img src={hero} alt="Street food stall in Sylhet at night" width={1600} height={912} className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-24 text-ink-foreground md:pt-36">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.05] md:text-6xl">{t("heroTitle")}</h1>
          <p className="mt-4 max-w-xl text-lg opacity-90">{t("heroSub")}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" variant="accent" onClick={locate} disabled={locating}>
              <LocateFixed /> {locating ? t("locating") : t("useLocation")}
            </Button>
            <Button size="lg" variant="glass" onClick={surprise}>
              <Shuffle /> {t("surprise")}
            </Button>
          </div>
          <p className="mt-3 text-sm opacity-80">{hasRealLocation ? t("usingReal") : t("usingDefault")}</p>
          {visitorCount !== null && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-ink-foreground/30 bg-ink/50 px-4 py-2 text-sm font-semibold">
              <Users aria-hidden="true" className="h-4 w-4" />
              <span>{lang === "bn" ? bnDigits(visitorCount) : visitorCount.toLocaleString()} {t("visitors")}</span>
            </p>
          )}
        </div>
      </section>

      {data && data.deals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-8">
          <h2 className="text-xl font-bold">🔥 {t("deals")}</h2>
          <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
            {data.deals.map((d) => {
              const r = data.restaurants.find((x) => x.id === d.restaurant_id);
              if (!r) return null;
              return (
                <button
                  key={d.id}
                  onClick={() => navigate({ to: "/place/$id", params: { id: r.id } })}
                  className="min-w-64 rounded-2xl bg-accent p-4 text-left text-accent-foreground shadow-card transition hover:-translate-y-0.5"
                >
                  <p className="text-xs font-semibold uppercase opacity-80">{displayName(r, lang)}</p>
                  <p className="mt-1 font-display text-lg font-bold leading-tight">{d.title}</p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="sticky top-16 z-[900] mt-6 border-y bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto">
            <div className="relative min-w-56 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("search")}
                className="h-9 w-full rounded-full border bg-card pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {chip(near, setNear, `🚶 ${t("within10")}`)}
            {chip(openNow, setOpenNow, t("openNow"))}
            {chip(cheap, setCheap, t("under200"))}
            {chip(halal, setHalal, t("halal"))}
            {chip(onlyFavs, setOnlyFavs, `♥ ${t("saved")}`)}
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`whitespace-nowrap rounded-lg px-3 py-1 text-sm font-semibold ${cat === c ? "bg-ink text-ink-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                {t(c)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1fr_1.1fr]">
        <div className="lg:sticky lg:top-44 lg:h-[calc(100vh-12rem)]">
          <FoodMap
            className="h-80 w-full overflow-hidden rounded-3xl border shadow-card lg:h-full"
            center={location}
            user={location}
            radiusM={(NEARBY_MINUTES * WALK_M_PER_MIN) / STREET_FACTOR}
            pins={rows.map((x) => ({ id: x.r.id, lat: x.r.lat, lng: x.r.lng, label: displayName(x.r, lang), category: x.r.category }))}
            activeId={active}
            onPinClick={(id) => navigate({ to: "/place/$id", params: { id } })}
          />
        </div>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {rows.length} {t("places")}
          </p>
          {rows.map((x) => (
            <PlaceCard
              key={x.r.id}
              r={x.r}
              meters={x.meters}
              minutes={x.minutes}
              open={x.open}
              deal={x.deal}
              rating={data?.ratings[x.r.id]}
              active={active === x.r.id}
              onHover={() => setActive(x.r.id)}
            />
          ))}
          {data && rows.length === 0 && (
            <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">{t("noResults")}</p>
          )}
        </div>
      </section>
    </main>
  );
}
