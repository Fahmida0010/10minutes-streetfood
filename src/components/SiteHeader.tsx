import { Link } from "@tanstack/react-router";
import { LogOut, MapPinPlus, Store } from "lucide-react";
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
      <div className="mx-auto grid min-h-16 max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-2 sm:flex sm:justify-between sm:gap-3 sm:px-4">
        <Link to="/" className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <img
            src={logoFoodCart}
            alt="10MinitesStreetfood"
            className="h-10 w-10 shrink-0 drop-shadow-sm sm:h-12 sm:w-12"
            width={48}
            height={48}
          />
          <span className="truncate font-display text-sm font-bold sm:text-lg">{t("brand")}</span>
        </Link>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="flex rounded-full border bg-card p-0.5 text-sm">
            {(["en", "bn"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`rounded-full px-2 py-1 font-medium transition sm:px-3 ${lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {l === "en" ? "EN" : "বাং"}
              </button>
            ))}
          </div>
          <Button asChild variant="accent" size="icon" className="sm:size-sm sm:rounded-full" aria-label={t("addPlace")} title={t("addPlace")}>
            <Link to="/suggest" aria-label={t("addPlace")}>
              <MapPinPlus /> <span className="hidden sm:inline">{t("addPlace")}</span>
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" className="sm:size-sm sm:rounded-full" aria-label={user ? t("myPlaces") : t("forOwners")} title={user ? t("myPlaces") : t("forOwners")}>
            <Link to="/dashboard" aria-label={user ? t("myPlaces") : t("forOwners")}>
              <Store /> <span className="hidden sm:inline">{user ? t("myPlaces") : t("forOwners")}</span>
            </Link>
          </Button>
          {user && (
            <Button variant="ghost" size="icon" className="sm:size-sm sm:w-auto sm:px-3" onClick={() => supabase.auth.signOut()} aria-label={t("signOut")} title={t("signOut")}>
              <LogOut className="sm:hidden" />
              <span className="hidden sm:inline">{t("signOut")}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
