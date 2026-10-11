import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/use-auth";
import { SYLHET_CENTER, categoryImage } from "@/lib/geo";
import type { Deal, MenuItem } from "@/lib/data";
import { FoodMap } from "@/components/FoodMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/dashboard/$id")({
  head: () => ({
    meta: [
      { title: "Edit place — 10 Minute Sylhet" },
      { name: "description", content: "Update your place details, menu prices and deals." },
      { property: "og:title", content: "Edit place — 10 Minute Sylhet" },
      { property: "og:description", content: "Update your place details, menu prices and deals." },
    ],
  }),
  component: EditPlace,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  name_bn: z.string().trim().max(100),
  category: z.enum(["restaurant", "street_food", "hotel", "cafe"]),
  description: z.string().trim().max(500),
  address: z.string().trim().min(2).max(200),
  area: z.string().trim().min(2).max(60),
  phone: z.string().trim().max(20),
  open_time: z.string().regex(/^\d{2}:\d{2}/),
  close_time: z.string().regex(/^\d{2}:\d{2}/),
  price_min: z.number().int().min(0).max(100000),
  price_max: z.number().int().min(0).max(100000),
  halal: z.boolean(),
  available: z.boolean(),
  lat: z.number(),
  lng: z.number(),
  image_url: z.string().nullable(),
});
type Form = z.infer<typeof schema>;

const empty: Form = {
  name: "", name_bn: "", category: "restaurant", description: "", address: "", area: "", phone: "",
  open_time: "10:00", close_time: "22:00", price_min: 50, price_max: 300, halal: true, available: true,
  lat: SYLHET_CENTER[0], lng: SYLHET_CENTER[1], image_url: null,
};

function EditPlace() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["edit-place", id],
    enabled: !isNew,
    queryFn: async () => {
      const [r, m, d] = await Promise.all([
        supabase.from("restaurants").select("*").eq("id", id).maybeSingle(),
        supabase.from("menu_items").select("*").eq("restaurant_id", id).order("created_at"),
        supabase.from("deals").select("*").eq("restaurant_id", id).order("created_at"),
      ]);
      return { r: r.data, menu: m.data ?? [], deals: d.data ?? [] };
    },
  });

  useEffect(() => {
    if (data?.r) {
      const r = data.r;
      setF({
        name: r.name, name_bn: r.name_bn ?? "", category: r.category as Form["category"], description: r.description ?? "",
        address: r.address, area: r.area, phone: r.phone ?? "", open_time: r.open_time.slice(0, 5),
        close_time: r.close_time.slice(0, 5), price_min: r.price_min, price_max: r.price_max, halal: r.halal,
        available: r.available, lat: r.lat, lng: r.lng, image_url: r.image_url,
      });
    }
  }, [data]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  async function upload(file: File) {
    if (!user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const { error } = await supabase.storage.from("restaurant-images").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data: s } = await supabase.storage.from("restaurant-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (s) set("image_url", s.signedUrl);
  }

  async function save() {
    const p = schema.safeParse(f);
    if (!p.success) { toast.error(p.error.issues[0]?.path.join(".") + ": " + p.error.issues[0]?.message); return; }
    setSaving(true);
    const row = { ...p.data, name_bn: p.data.name_bn || null, phone: p.data.phone || null, updated_at: new Date().toISOString() };
    if (isNew) {
      const { data: ins, error } = await supabase.from("restaurants").insert({ ...row, owner_id: user!.id }).select("id").single();
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Your place is live!");
      qc.invalidateQueries({ queryKey: ["restaurants"] });
      nav({ to: "/dashboard/$id", params: { id: ins.id } });
    } else {
      const { error } = await supabase.from("restaurants").update(row).eq("id", id);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Saved");
      qc.invalidateQueries();
    }
  }

  async function remove() {
    if (!confirm("Delete this place?")) return;
    await supabase.from("restaurants").delete().eq("id", id);
    qc.invalidateQueries();
    nav({ to: "/dashboard" });
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> My places
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold">{isNew ? "Add your place" : f.name || "Edit place"}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-3xl border bg-card p-5">
          <Field label="Name (English)"><Input value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="নাম (বাংলা)"><Input value={f.name_bn} onChange={(e) => set("name_bn", e.target.value)} /></Field>
          <Field label="Type">
            <select value={f.category} onChange={(e) => set("category", e.target.value as Form["category"])} className="h-9 w-full rounded-md border bg-background px-3 text-sm">
              <option value="restaurant">Restaurant</option>
              <option value="street_food">Street food</option>
              <option value="hotel">Hotel</option>
              <option value="cafe">Cafe</option>
            </select>
          </Field>
          <Field label="Short description"><Textarea maxLength={500} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Address"><Input value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
            <Field label="Area (e.g. Zindabazar)"><Input value={f.area} onChange={(e) => set("area", e.target.value)} /></Field>
            <Field label="Phone"><Input value={f.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
            <div />
            <Field label="Opens"><Input type="time" value={f.open_time} onChange={(e) => set("open_time", e.target.value)} /></Field>
            <Field label="Closes"><Input type="time" value={f.close_time} onChange={(e) => set("close_time", e.target.value)} /></Field>
            <Field label="Lowest price ৳"><Input type="number" value={f.price_min} onChange={(e) => set("price_min", Number(e.target.value))} /></Field>
            <Field label="Highest price ৳"><Input type="number" value={f.price_max} onChange={(e) => set("price_max", Number(e.target.value))} /></Field>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm"><Switch checked={f.halal} onCheckedChange={(v) => set("halal", v)} /> Halal</label>
            <label className="flex items-center gap-2 text-sm"><Switch checked={f.available} onCheckedChange={(v) => set("available", v)} /> Open today</label>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-3xl border bg-card p-5">
            <Label>Photo</Label>
            <img src={f.image_url || categoryImage(f.category)} alt="" className="mt-2 h-44 w-full rounded-2xl object-cover" />
            <Input type="file" accept="image/*" className="mt-2" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          </div>
          <div className="rounded-3xl border bg-card p-5">
            <Label>Location — tap the map on your exact spot</Label>
            <FoodMap
              className="mt-2 h-64 w-full overflow-hidden rounded-2xl"
              center={[f.lat, f.lng]}
              pins={[{ id: "me", lat: f.lat, lng: f.lng, label: f.name || "Here", category: f.category }]}
              onMapClick={(lat, lng) => setF((p) => ({ ...p, lat, lng }))}
              zoom={16}
            />
          </div>
          <div className="flex gap-2">
            <Button size="lg" className="flex-1 rounded-full" onClick={save} disabled={saving}>
              {isNew ? "Publish place" : "Save changes"}
            </Button>
            {!isNew && (
              <Button size="lg" variant="outline" className="rounded-full" onClick={remove} aria-label="Delete">
                <Trash2 />
              </Button>
            )}
          </div>
        </section>
      </div>

      {!isNew && data && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <MenuEditor restaurantId={id} items={data.menu} />
          <DealsEditor restaurantId={id} deals={data.deals} />
        </div>
      )}
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function MenuEditor({ restaurantId, items }: { restaurantId: string; items: MenuItem[] }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const refresh = () => qc.invalidateQueries();
  async function add() {
    const p = z.object({ name: z.string().trim().min(1).max(80), price: z.number().int().min(0).max(100000) }).safeParse({ name, price: Number(price) });
    if (!p.success) { toast.error("Enter item name and price"); return; }
    const { error } = await supabase.from("menu_items").insert({ restaurant_id: restaurantId, ...p.data });
    if (error) { toast.error(error.message); return; }
    setName(""); setPrice(""); refresh();
  }
  return (
    <section className="rounded-3xl border bg-card p-5">
      <h2 className="text-xl font-bold">Menu & exact prices</h2>
      <ul className="mt-3 divide-y">
        {items.map((m) => (
          <li key={m.id} className="flex items-center gap-3 py-2">
            <span className="flex-1">{m.name}</span>
            <span className="font-semibold">৳{m.price}</span>
            <label className="flex items-center gap-1 text-xs">
              <Switch checked={m.available} onCheckedChange={async (v) => { await supabase.from("menu_items").update({ available: v }).eq("id", m.id); refresh(); }} />
              {m.available ? "Available" : "Sold out"}
            </label>
            <button onClick={async () => { await supabase.from("menu_items").delete().eq("id", m.id); refresh(); }} aria-label="Remove">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Input placeholder="Item (e.g. Beef Bhuna)" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="৳" type="number" className="w-24" value={price} onChange={(e) => setPrice(e.target.value)} />
        <Button onClick={add}>Add</Button>
      </div>
    </section>
  );
}

function DealsEditor({ restaurantId, deals }: { restaurantId: string; deals: Deal[] }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [days, setDays] = useState("1");
  async function add() {
    const t = title.trim();
    if (!t || t.length > 120) { toast.error("Write a short deal (max 120 characters)"); return; }
    const ends = new Date(Date.now() + Math.max(1, Math.min(60, Number(days) || 1)) * 86400000).toISOString();
    const { error } = await supabase.from("deals").insert({ restaurant_id: restaurantId, title: t, ends_at: ends });
    if (error) { toast.error(error.message); return; }
    setTitle(""); qc.invalidateQueries();
  }
  return (
    <section className="rounded-3xl border bg-card p-5">
      <h2 className="text-xl font-bold">Deals</h2>
      <p className="text-sm text-muted-foreground">Deals appear on the home page and attract nearby visitors.</p>
      <ul className="mt-3 divide-y">
        {deals.map((d) => (
          <li key={d.id} className="flex items-center gap-3 py-2">
            <span className="flex-1">🔥 {d.title}</span>
            <span className="text-xs text-muted-foreground">until {new Date(d.ends_at).toLocaleDateString()}</span>
            <button onClick={async () => { await supabase.from("deals").delete().eq("id", d.id); qc.invalidateQueries(); }} aria-label="Remove">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Input placeholder="e.g. 10% off after 9pm" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input type="number" className="w-20" value={days} onChange={(e) => setDays(e.target.value)} title="Days" />
        <Button onClick={add}>Add</Button>
      </div>
    </section>
  );
}
