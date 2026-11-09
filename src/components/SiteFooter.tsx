import { Link } from "@tanstack/react-router";
import { Github, Linkedin } from "lucide-react";
import { useApp } from "@/lib/app-context";
import logoFoodCart from "@/assets/logo-foodcart.png";

export function SiteFooter() {
  const { t } = useApp();
  return (
    <footer className="mt-16 border-t bg-ink text-ink-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-10 text-center">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logoFoodCart}
            alt="10MinitesStreetfood"
            className="h-16 w-16 drop-shadow-md"
            width={64}
            height={64}
          />
          <span className="font-display text-xl font-bold">{t("brand")}</span>
        </Link>
        <p className="max-w-md text-sm opacity-80">{t("footerNote")}</p>
        <p className="text-sm font-medium">{t("developerCredit")}</p>
        <nav aria-label="Social profiles" className="flex items-center gap-5">
          <a
            href="https://www.linkedin.com/in/fahmida-akter-tanjina/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fahmida Akter Tanjina on LinkedIn"
            title="LinkedIn"
            className="opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <Linkedin aria-hidden="true" size={22} />
          </a>
          <a
            href="https://github.com/Fahmida0010"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Fahmida Akter Tanjina on GitHub"
            title="GitHub"
            className="opacity-80 transition-opacity hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <Github aria-hidden="true" size={22} />
          </a>
        </nav>
        <p className="text-xs opacity-60">© {new Date().getFullYear()} 10MinitesStreetfood</p>
      </div>
    </footer>
  );
}
