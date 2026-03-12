"use client";

import { useTranslations } from "next-intl";
import { Search, Users } from "lucide-react";
import { GuestCard, type Guest } from "./GuestCard";

interface GuestListProps {
  guests: Guest[];
  isLoading: boolean;
  query: string;
  hasSearched: boolean;
}

export function GuestList({ guests, isLoading, query, hasSearched }: GuestListProps) {
  const t = useTranslations("search");

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-sentinel-muted">
        <div className="size-8 animate-spin rounded-full border-2 border-sentinel-muted border-t-sentinel-accent mb-3" />
        <p className="text-sm">{t("searching")}</p>
      </div>
    );
  }

  // Initial state - no search performed yet
  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sentinel-muted">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-sentinel-card/50 mb-4">
          <Search className="size-7 opacity-40" />
        </div>
        <p className="text-sm font-medium">{t("searchPrompt")}</p>
        <p className="text-xs mt-1.5 text-sentinel-muted/70">{t("minChars")}</p>
      </div>
    );
  }

  // Empty results
  if (guests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-sentinel-muted">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-sentinel-card/50 mb-4">
          <Users className="size-7 opacity-40" />
        </div>
        <p className="text-sm font-medium">{t("noResults")}</p>
        <p className="text-xs mt-1.5 text-sentinel-muted/70">
          {t("noResultsFor", { query })}
        </p>
      </div>
    );
  }

  // Results
  return (
    <div>
      <p className="text-sm text-sentinel-muted mb-4">
        {t("resultCount", { count: guests.length, query })}
      </p>
      <div className="flex flex-col gap-3">
        {guests.map((guest) => (
          <GuestCard key={guest.id} guest={guest} />
        ))}
      </div>
    </div>
  );
}
