import { Link } from "@tanstack/react-router";
import { Footprints, Heart, Star } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { categoryImage, formatDistance } from "@/lib/geo";
import { displayName, type Restaurant } from "@/lib/data";

type Props = {
  r: Restaurant;
  meters: number;
  minutes: number;
  open: boolean;
  rating?: { sum: number; n: number } | undefined;
  deal?: string | undefined;
  active?: boolean;
  onHover?: () => void;
};

export function PlaceCard({ r, meters, minutes, open, rating, deal, active, onHover }: Props) {
  const { lang, t, favs, toggleFav } = useApp();
  const fav = favs.includes(r.id);
  const nearby = minutes <= 10;
  return (
    <div
      onMouseEnter={onHover}
      className={`group relative flex gap-4 rounded-2xl border bg-card p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop ${active ? "ring-2 ring-accent" : ""}`}
    >
      <Link to="/place/$id" params={{ id: r.id }} className="absolute inset-0 z-0" aria-label={r.name} />
      <img
        src={r.image_url || categoryImage(r.category)}
        alt={r.name}
        loading="lazy"
        width={112}
        height={112}
        className="h-28 w-28 shrink-0 rounded-xl object-cover"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t(r.category as "restaurant")} · {r.area}
            </p>
            <h3 className="truncate text-lg font-bold leading-tight">{displayName(r, lang)}</h3>
          </div>
          <button
            onClick={() => toggleFav(r.id)}
            className="relative z-10 rounded-full p-1.5 hover:bg-muted"
            aria-label="Save"
          >
            <Heart className={`h-5 w-5 ${fav ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ${nearby ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}
          >
            <Footprints className="h-3.5 w-3.5" /> {minutes} {t("minWalk")}
          </span>
          <span className="text-muted-foreground">{formatDistance(meters)}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${open ? "bg-success/15 text-success" : "bg-destructive/10 text-destructive"}`}
          >
            {!r.available ? t("unavailable") : open ? t("open") : t("closed")}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-3 text-sm">
          <span className="font-semibold">
            ৳{r.price_min}–{r.price_max}
          </span>
          {rating && rating.n > 0 && (
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              {(rating.sum / rating.n).toFixed(1)} <span className="text-muted-foreground">({rating.n})</span>
            </span>
          )}
        </div>
        {deal && (
          <p className="mt-2 truncate rounded-lg bg-accent/25 px-2 py-1 text-xs font-medium text-accent-foreground">
            🔥 {deal}
          </p>
        )}
      </div>
    </div>
  );
}
