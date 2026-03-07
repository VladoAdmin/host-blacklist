"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-sentinel-border bg-sentinel-bg">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-sentinel-muted">
        {t("copyright")}
      </div>
    </footer>
  );
}
