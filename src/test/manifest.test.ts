import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../..");
const manifestPath = path.join(root, "public/manifest.webmanifest");

type Manifest = {
  name: string;
  short_name: string;
  start_url: string;
  scope: string;
  display: string;
  theme_color: string;
  background_color: string;
  icons: { src: string; sizes: string; type: string; purpose?: string }[];
};

function readManifest(): Manifest {
  return JSON.parse(readFileSync(manifestPath, "utf8")) as Manifest;
}

// A phone only offers "Add to Home Screen" when the manifest is valid JSON and
// carries the fields the install prompt is built from.
describe("Installable app manifest", () => {
  it("has the install fields a phone needs", () => {
    const m = readManifest();

    expect(m.name.length).toBeGreaterThan(0);
    expect(m.short_name.length).toBeGreaterThan(0);
    expect(m.short_name.length).toBeLessThanOrEqual(12);
    expect(m.start_url).toBe("/");
    expect(m.scope).toBe("/");
    expect(m.display).toBe("standalone");
    expect(m.theme_color).toMatch(/^#[0-9a-f]{6}$/);
    expect(m.background_color).toMatch(/^#[0-9a-f]{6}$/);
  });

  it("ships a 512px icon, a maskable icon and an apple touch icon", () => {
    const m = readManifest();

    const any512 = m.icons.find((i) => i.sizes === "512x512" && (i.purpose ?? "any") === "any");
    const maskable = m.icons.find((i) => i.purpose === "maskable");
    const apple = m.icons.find((i) => i.sizes === "180x180");

    expect(any512?.src).toBe("/icons/icon-512.png");
    expect(maskable?.sizes).toBe("512x512");
    expect(apple?.src).toBe("/icons/apple-touch-icon.png");
  });

  it("points every icon entry at a real file", () => {
    const m = readManifest();

    for (const icon of m.icons) {
      const file = path.join(root, "public", icon.src.replace(/^\//, ""));
      expect(existsSync(file), `${icon.src} is missing`).toBe(true);
      expect(icon.type).toBe("image/png");
    }
  });
});
