"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
        {t("copyright")}
      </div>
    </footer>
  );
}
