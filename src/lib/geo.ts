import catRestaurant from "@/assets/cat-restaurant.jpg";
import catStreet from "@/assets/cat-street.jpg";
import catHotel from "@/assets/cat-hotel.jpg";

export type LatLng = [number, number];

/** Default spot when visitor hasn't shared location: Zindabazar Point, Sylhet. */
export const SYLHET_CENTER: LatLng = [24.8955, 91.8685];

/** Average walking speed in metres per minute. */
export const WALK_M_PER_MIN = 80;
/** Streets are never straight: straight-line distance × this ≈ real walking distance. */
export const STREET_FACTOR = 1.25;
export const NEARBY_MINUTES = 10;

export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function walkMinutes(straightMeters: number): number {
  return Math.max(1, Math.ceil((straightMeters * STREET_FACTOR) / WALK_M_PER_MIN));
}

export function isWithinTenMinutes(straightMeters: number): boolean {
  return walkMinutes(straightMeters) <= NEARBY_MINUTES;
}

/** Beyond this many minutes on foot a walking route stops being useful. */
export const WALK_LIMIT_MIN = 90;

export function isTooFarToWalk(straightMeters: number): boolean {
  return walkMinutes(straightMeters) > WALK_LIMIT_MIN;
}

export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
}

function toMinutes(t: string): number {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

/** Current minutes-of-day in Sylhet (Asia/Dhaka). */
export function dhakaMinutesNow(date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

/** Handles places closing after midnight (e.g. 18:00–02:00). */
export function isOpenAt(open: string, close: string, nowMinutes: number): boolean {
  const o = toMinutes(open);
  const c = toMinutes(close);
  if (o === c) return true;
  if (o < c) return nowMinutes >= o && nowMinutes < c;
  return nowMinutes >= o || nowMinutes < c;
}

export function formatTime(t: string): string {
  const [h = 0, m = 0] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** "12 min 30 sec" from a duration in seconds. */
export function formatExactWalk(sec: number): string {
  const total = Math.max(0, Math.round(sec));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s} sec`;
  return s === 0 ? `${m} min` : `${m} min ${s} sec`;
}

/** Wall clock in Sylhet (Asia/Dhaka), e.g. "9:42 PM". */
export function dhakaClock(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24;
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const suffix = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** Clock time you arrive if you start walking now. */
export function arrivalLabel(sec: number, from = new Date()): string {
  return dhakaClock(new Date(from.getTime() + Math.max(0, Math.round(sec)) * 1000));
}

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";

/** Swap Latin digits for Bangla ones inside any label. */
export function bnDigitsOf(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function categoryImage(category: string): string {
  if (category === "street_food") return catStreet;
  if (category === "hotel") return catHotel;
  return catRestaurant;
}

export function categoryEmoji(category: string): string {
  if (category === "street_food") return "🥟";
  if (category === "hotel") return "🏨";
  if (category === "cafe") return "☕";
  return "🍛";
}
