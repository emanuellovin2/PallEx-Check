"use client";

import { useEffect, useState } from "react";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

function isIOS() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroid, setShowAndroid] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (sessionStorage.getItem(DISMISS_KEY)) return;

    if (isIOS()) {
      setShowIOS(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroid(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setShowAndroid(false);
    setShowIOS(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShowAndroid(false);
    setDeferredPrompt(null);
  }

  if (!showAndroid && !showIOS) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600">
            <Download className="h-5 w-5 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white text-sm">Instalează PallEx Check</p>

            {showAndroid && (
              <>
                <p className="mt-0.5 text-xs text-slate-400">
                  Adaugă pe ecranul principal pentru acces rapid offline.
                </p>
                <button
                  onClick={install}
                  className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white active:bg-blue-700"
                >
                  Instalează
                </button>
              </>
            )}

            {showIOS && (
              <>
                <p className="mt-0.5 text-xs text-slate-400">
                  Apasă{" "}
                  <span className="inline-flex items-center gap-0.5 font-medium text-white">
                    <Share className="h-3.5 w-3.5" /> Share
                  </span>{" "}
                  apoi{" "}
                  <span className="font-medium text-white">"Adaugă la ecranul principal"</span>.
                </p>
              </>
            )}
          </div>

          <button
            onClick={dismiss}
            className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-white"
            aria-label="Închide"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
