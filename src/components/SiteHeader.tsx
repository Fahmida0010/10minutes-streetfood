import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { House, LogOut, MapPinPlus, Menu, Store, X } from "lucide-react";
import { useApp } from "@/lib/app-context";
import { useAuth } from "@/lib/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import logoFoodCart from "@/assets/logo-foodcart.png";

export function SiteHeader() {
  const { lang, setLang, t } = useApp();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-[1000] border-b bg-background/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:min-h-20 sm:gap-3">
          <Link to="/" onClick={closeMenu} className="flex min-w-0 items-center gap-2">
            <img
              src={logoFoodCart}
              alt="10MinitesStreetfood"
              className="h-10 w-10 shrink-0 drop-shadow-sm sm:h-12 sm:w-12"
              width={48}
              height={48}
            />
            <span className="truncate font-display text-sm font-bold sm:text-base md:text-lg">
              {t("brand")}
            </span>
          </Link>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="flex rounded-full border bg-card p-0.5 text-sm" aria-label="Language">
              {(["en", "bn"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  aria-pressed={lang === l}
                  className={`min-h-8 rounded-full px-2.5 py-1 font-medium transition sm:px-3 ${
                    lang === l ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  }`}
                >
                  {l === "en" ? "EN" : "বাং"}
                </button>
              ))}
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <Button
                asChild
                variant="outline"
                size="icon"
                className="shrink-0 rounded-full lg:w-auto lg:px-4"
                aria-label={t("home")}
                title={t("home")}
              >
                <Link to="/" aria-label={t("home")} activeOptions={{ exact: true }} className="flex items-center gap-1.5">
                  <House /> <span className="hidden lg:inline">{t("home")}</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="accent"
                size="icon"
                className="shrink-0 rounded-full lg:w-auto lg:px-4"
                aria-label={t("addPlace")}
                title={t("addPlace")}
              >
                <Link to="/suggest" aria-label={t("addPlace")}>
                  <MapPinPlus /> <span className="hidden lg:inline">{t("addPlace")}</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="icon"
                className="shrink-0 rounded-full lg:w-auto lg:px-4"
                aria-label={user ? t("myPlaces") : t("forOwners")}
                title={user ? t("myPlaces") : t("forOwners")}
              >
                <Link to="/dashboard" aria-label={user ? t("myPlaces") : t("forOwners")}>
                  <Store /> <span className="hidden lg:inline">{user ? t("myPlaces") : t("forOwners")}</span>
                </Link>
              </Button>
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 lg:w-auto lg:px-4"
                  onClick={() => supabase.auth.signOut()}
                  aria-label={t("signOut")}
                  title={t("signOut")}
                >
                  <LogOut /> <span className="hidden lg:inline">{t("signOut")}</span>
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 rounded-full sm:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            >
              {menuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="grid grid-cols-2 gap-2 border-t py-3 sm:hidden"
          >
            <Button asChild variant="outline" className="min-w-0 justify-center">
              <Link to="/" onClick={closeMenu} activeOptions={{ exact: true }} className="flex min-w-0 items-center justify-center gap-1.5">
                <House className="shrink-0" />
                <span className="truncate">{t("home")}</span>
              </Link>
            </Button>
            <Button asChild variant="accent" className="min-w-0 justify-center">
              <Link to="/suggest" onClick={closeMenu}>
                <MapPinPlus className="shrink-0" />
                <span className="truncate">{t("addPlace")}</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="col-span-2 min-w-0 justify-center">
              <Link to="/dashboard" onClick={closeMenu}>
                <Store className="shrink-0" />
                <span className="truncate">{user ? t("myPlaces") : t("forOwners")}</span>
              </Link>
            </Button>
            {user && (
              <Button
                variant="ghost"
                className="col-span-2"
                onClick={() => {
                  closeMenu();
                  void supabase.auth.signOut();
                }}
              >
                <LogOut className="shrink-0" />
                <span>{t("signOut")}</span>
              </Button>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}
