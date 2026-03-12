"use client";

import { useTranslations } from "next-intl";
import { Shield } from "lucide-react";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-sentinel-border/30 bg-sentinel-bg/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-sentinel-muted">
          <Shield className="size-3.5 text-sentinel-accent/60" />
          <span>Sentinel HostGuard</span>
        </div>
        <p className="text-sm text-sentinel-muted/70">
          {t("copyright")}
        </p>
      </div>
    </footer>
  );
}
