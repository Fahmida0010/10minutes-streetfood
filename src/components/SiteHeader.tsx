import { Link } from "@tanstack/react-router";
import { MapPinPlus, Store } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logoFoodCart from "@/assets/logo-foodcart.png";

export function SiteHeader() {
  const { lang, setLang, t } = useApp();
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-[1000] border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logoFoodCart}
            alt="10MinitesStreetfood"
            className="h-9 w-9 shrink-0 drop-shadow-sm"
            width={36}
            height={36}
          />
          <span className="font-display text-lg font-bold">{t("brand")}</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border bg-card p-0.5 text-sm">
            {(["en", "bn"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-full px-3 py-1 font-medium transition ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {l === "en" ? "EN" : "বাং"}
              </button>
            ))}
          </div>
          <Button asChild variant="accent" size="sm" className="rounded-full">
            <Link to="/suggest">
              <MapPinPlus /> <span className="hidden sm:inline">{t("addPlace")}</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link to="/dashboard">
              <Store /> <span className="hidden sm:inline">{user ? t("myPlaces") : t("forOwners")}</span>
            </Link>
          </Button>
          {user && (
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()}>
              {t("signOut")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
