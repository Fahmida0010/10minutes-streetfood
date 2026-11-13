import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/use-auth";
import { SYLHET_CENTER, type LatLng } from "@/lib/geo";
import { FoodMap } from "@/components/FoodMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/suggest")({
  head: () => ({
    meta: [
      { title: "Add a street food place — 10MinitesStreetfood" },
      { name: "description", content: "Add a street food stall, hotel or restaurant with its exact map location, prices and opening hours." },
      { property: "og:title", content: "Add a street food place — 10MinitesStreetfood" },
      { property: "og:description", content: "Add a street food stall, hotel or restaurant with its exact map location, prices and opening hours." },
    ],
  }),
  component: SuggestPage,
});

const CATS = ["street_food", "restaurant", "hotel", "cafe"] as const;

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  name_bn: z.string().trim().max(100),
  area: z.string().trim().min(2).max(100),
  address: z.string().trim().max(200),
  phone: z.string().trim().max(20),
  description: z.string().trim().max(500),
  price_min: z.number().int().min(0).max(100000),
  price_max: z.number().int().min(0).max(100000),
});

function SuggestPage() {
  const { t, location } = useApp();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [pin, setPin] = useState<LatLng | null>(null);
  const [cat, setCat] = useState<(typeof CATS)[number]>("street_food");
  const [halal, setHalal] = useState(true);
  const [name, setName] = useState("");
  const [nameBn, setNameBn] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [priceMin, setPriceMin] = useState("20");
  const [priceMax, setPriceMax] = useState("150");
  const [openTime, setOpenTime] = useState("10:00");
  const [closeTime, setCloseTime] = useState("22:00");
  const [busy, setBusy] = useState(false);

  if (loading) return <div className="mx-auto max-w-3xl p-8 text-muted-foreground">…</div>;

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 text-center sm:py-20">
        <h1 className="text-3xl font-extrabold">{t("addPlaceTitle")}</h1>
        <p className="mt-3 text-muted-foreground">{t("addPlaceSub")}</p>
        <Button asChild size="lg" className="mt-6 rounded-full">
          <Link to="/auth">{t("signInToAdd")}</Link>
        </Button>
      </main>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pin) { toast.error(t("tapMap")); return; }
    const p = schema.safeParse({
      name, name_bn: nameBn, area, address, phone, description,
      price_min: Number(priceMin), price_max: Number(priceMax),
    });
    if (!p.success) { toast.error("Please fill name, area and valid prices"); return; }
    if (p.data.price_max < p.data.price_min) { toast.error("Highest price must be ≥ lowest price"); return; }
    setBusy(true);
    const { data, error } = await supabase
      .from("restaurants")
      .insert({
        owner_id: user!.id,
        name: p.data.name,
        name_bn: p.data.name_bn || null,
        category: cat,
        area: p.data.area,
        address: p.data.address,
        phone: p.data.phone || null,
        description: p.data.description || null,
        lat: pin[0],
        lng: pin[1],
        price_min: p.data.price_min,
        price_max: p.data.price_max,
        open_time: openTime,
        close_time: closeTime,
        halal,
      })
      .select("id")
      .single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("placeAdded"));
    nav({ to: "/place/$id", params: { id: data.id } });
  }

  return (
    <main className="mx-auto max-w-5xl px-3 py-6 sm:px-4 sm:py-10">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t("addPlaceTitle")}</h1>
      <p className="mt-2 text-muted-foreground">{t("addPlaceSub")}</p>

      <form onSubmit={submit} className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Input placeholder={t("placeName")} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} />
          <Input placeholder={t("placeNameBn")} value={nameBn} maxLength={100} onChange={(e) => setNameBn(e.target.value)} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input placeholder={t("area")} value={area} maxLength={100} onChange={(e) => setArea(e.target.value)} />
            <Input placeholder={t("phone")} value={phone} maxLength={20} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <Input placeholder={t("address")} value={address} maxLength={200} onChange={(e) => setAddress(e.target.value)} />
          <Textarea placeholder={t("description")} value={description} maxLength={500} onChange={(e) => setDescription(e.target.value)} />
          <div className="flex flex-wrap gap-1">
            {CATS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${cat === c ? "bg-primary text-primary-foreground" : "border bg-card"}`}
              >
                {t(c)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setHalal(!halal)}
              className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${halal ? "bg-primary text-primary-foreground" : "border bg-card"}`}
            >
              {t("halal")}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              <span className="text-muted-foreground">{t("priceMin")}</span>
              <Input type="number" min={0} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">{t("priceMax")}</span>
              <Input type="number" min={0} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">{t("openTime")}</span>
              <Input type="time" value={openTime} onChange={(e) => setOpenTime(e.target.value)} />
            </label>
            <label className="text-sm">
              <span className="text-muted-foreground">{t("closeTime")}</span>
              <Input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <FoodMap
            className="h-80 w-full overflow-hidden rounded-3xl border shadow-card"
            center={pin ?? location ?? SYLHET_CENTER}
            user={location}
            pins={pin ? [{ id: "new", lat: pin[0], lng: pin[1], label: name || t("addPlace"), category: cat }] : []}
            onMapClick={(lat, lng) => setPin([lat, lng])}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setPin(location)}>
              <LocateFixed /> {t("useMyLocation")}
            </Button>
            <p className="text-sm text-muted-foreground">
              <MapPin className="mr-1 inline h-4 w-4" />
              {pin ? `${t("coords")}: ${pin[0].toFixed(5)}, ${pin[1].toFixed(5)}` : t("tapMap")}
            </p>
          </div>
          <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>
            {t("submitPlace")}
          </Button>
        </div>
      </form>
    </main>
  );
}
