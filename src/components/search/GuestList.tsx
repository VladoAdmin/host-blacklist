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
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mb-3" />
        <p className="text-sm">{t("searching")}</p>
      </div>
    );
  }

  // Initial state - no search performed yet
  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Search className="size-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">{t("searchPrompt")}</p>
        <p className="text-xs mt-1">{t("minChars")}</p>
      </div>
    );
  }

  // Empty results
  if (guests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Users className="size-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">{t("noResults")}</p>
        <p className="text-xs mt-1">
          {t("noResultsFor", { query })}
        </p>
      </div>
    );
  }

  // Results
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        {t("resultCount", { count: guests.length, query })}
      </p>
      <div className="flex flex-col gap-2">
        {guests.map((guest) => (
          <GuestCard key={guest.id} guest={guest} />
        ))}
      </div>
    </div>
  );
}
