import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "@/lib/geo";
import { categoryEmoji } from "@/lib/geo";

export type Pin = { id: string; lat: number; lng: number; label: string; category: string };

type Props = {
  center: LatLng;
  user?: LatLng;
  pins: Pin[];
  activeId?: string | null;
  route?: LatLng[];
  radiusM?: number;
  zoom?: number;
  onPinClick?: (id: string) => void;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
};

export function FoodMap(props: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const LRef = useRef<typeof import("leaflet") | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const propsRef = useRef(props);
  propsRef.current = props;

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((mod) => {
      const L = (mod as unknown as { default?: typeof import("leaflet") }).default ?? mod;
      if (cancelled || !el.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(el.current, { zoomControl: true }).setView(
        propsRef.current.center,
        propsRef.current.zoom ?? 15,
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap",
      }).addTo(map);
      map.on("click", (e) => propsRef.current.onMapClick?.(e.latlng.lat, e.latlng.lng));
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      draw();
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const L = LRef.current;
    const layer = layerRef.current;
    const map = mapRef.current;
    if (!L || !layer || !map) return;
    const p = propsRef.current;
    layer.clearLayers();
    if (p.user) {
      if (p.radiusM) {
        L.circle(p.user, {
          radius: p.radiusM,
          color: "oklch(0.45 0.11 155)",
          weight: 1,
          fillOpacity: 0.07,
        }).addTo(layer);
      }
      L.marker(p.user, {
        icon: L.divIcon({ className: "", html: '<div class="map-user"></div>', iconSize: [18, 18] }),
      }).addTo(layer);
    }
    for (const pin of p.pins) {
      const cls = pin.category === "street_food" ? "street" : pin.category === "hotel" ? "hotel" : "";
      const m = L.marker([pin.lat, pin.lng], {
        icon: L.divIcon({
          className: "",
          html: `<div class="map-pin ${cls} ${p.activeId === pin.id ? "active" : ""}"><span>${categoryEmoji(pin.category)}</span></div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        }),
        title: pin.label,
      }).addTo(layer);
      m.bindTooltip(pin.label, { direction: "top", offset: [0, -30] });
      m.on("click", () => propsRef.current.onPinClick?.(pin.id));
    }
    if (p.route && p.route.length > 1) {
      const line = L.polyline(p.route, { color: "oklch(0.58 0.2 28)", weight: 5, dashArray: "2 8", lineCap: "round" }).addTo(layer);
      map.fitBounds(line.getBounds(), { padding: [40, 40] });
    }
  }

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.pins, props.user, props.activeId, props.route, props.radiusM]);

  useEffect(() => {
    mapRef.current?.setView(props.center, mapRef.current.getZoom());
  }, [props.center[0], props.center[1]]);

  return <div ref={el} className={props.className} />;
}
