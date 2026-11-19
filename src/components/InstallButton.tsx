import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/app-context";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function isIOSSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOSDevice =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return iOSDevice && !("BeforeInstallPromptEvent" in window);
}

function isAndroid() {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

/**
 * Install affordance for the web app: uses the browser's own install prompt when
 * it offers one, otherwise shows the menu instructions for that platform.
 * Renders nothing once the app is already running installed.
 */
export function InstallButton({
  mode = "icon",
  className = "",
}: {
  mode?: "icon" | "row";
  className?: string;
}) {
  const { t } = useApp();
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [showMenuHint, setShowMenuHint] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setPromptEvent(null);
      setShowIOSHint(false);
      setShowMenuHint(false);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (isIOSSafari()) setShowIOSHint(true);
    else if (isAndroid()) setShowMenuHint(true);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!promptEvent && !showIOSHint && !showMenuHint) return null;

  const hint = promptEvent ? null : showIOSHint ? t("installHint") : t("installHintMenu");

  const onClick = async () => {
    if (!promptEvent) {
      toast(hint ?? "", { duration: 9000 });
      return;
    }
    await promptEvent.prompt();
    await promptEvent.userChoice;
    setPromptEvent(null);
  };

  const icon = <Download className="shrink-0" aria-hidden />;

  if (mode === "row") {
    return (
      <Button
        type="button"
        variant="outline"
        className={`min-w-0 justify-center ${className}`}
        onClick={onClick}
      >
        {icon}
        <span className="truncate">{t("installApp")}</span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={`shrink-0 rounded-full lg:w-auto lg:px-4 ${className}`}
      onClick={onClick}
      aria-label={t("installApp")}
      title={t("installApp")}
    >
      {icon} <span className="hidden lg:inline">{t("installApp")}</span>
    </Button>
  );
}
