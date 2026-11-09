import { createContext, useCallback, useContext, useEffect, useState, type Context, type ReactNode } from "react";
import { SYLHET_CENTER, type LatLng } from "./geo";
import { dict, type Lang, type DictKey } from "./i18n";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: DictKey) => string;
  location: LatLng;
  hasRealLocation: boolean;
  locate: () => void;
  locating: boolean;
  favs: string[];
  toggleFav: (id: string) => void;
};

const contextStore = globalThis as typeof globalThis & { __tenMinitesAppContext?: Context<Ctx | null> };
const AppCtx = contextStore.__tenMinitesAppContext ?? createContext<Ctx | null>(null);
contextStore.__tenMinitesAppContext = AppCtx;

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [location, setLocation] = useState<LatLng>(SYLHET_CENTER);
  const [hasRealLocation, setHasReal] = useState(false);
  const [locating, setLocating] = useState(false);
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    const l = localStorage.getItem("lang");
    if (l === "bn" || l === "en") setLangState(l);
    try {
      setFavs(JSON.parse(localStorage.getItem("favs") || "[]"));
      const loc = JSON.parse(localStorage.getItem("loc") || "null");
      if (Array.isArray(loc)) {
        setLocation(loc as LatLng);
        setHasReal(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("lang", l);
  };

  const locate = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: LatLng = [pos.coords.latitude, pos.coords.longitude];
        setLocation(p);
        setHasReal(true);
        localStorage.setItem("loc", JSON.stringify(p));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const toggleFav = (id: string) => {
    setFavs((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("favs", JSON.stringify(next));
      return next;
    });
  };

  const t = (k: DictKey) => dict[lang][k] ?? dict.en[k];

  return (
    <AppCtx.Provider
      value={{ lang, setLang, t, location, hasRealLocation, locate, locating, favs, toggleFav }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside AppProvider");
  return c;
}
