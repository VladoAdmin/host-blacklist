"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuthContext } from "@/app/providers";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { SearchBar } from "@/components/search/SearchBar";
import { GuestList } from "@/components/search/GuestList";
import type { Guest } from "@/components/search/GuestCard";

export default function SearchPage() {
  const { loading: authLoading } = useAuthContext();
  const t = useTranslations("search");
  const tCommon = useTranslations("common");

  const [query, setQuery] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const searchGuests = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setGuests([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/guests/search?q=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) {
        console.error("Search failed:", res.status);
        setGuests([]);
      } else {
        const data = await res.json();
        setGuests(data.guests || []);
      }
      setHasSearched(true);
    } catch (err) {
      console.error("Search error:", err);
      setGuests([]);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    searchGuests(debouncedQuery);
  }, [debouncedQuery, searchGuests]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-sentinel-muted border-t-transparent" />
          <p className="text-sm text-sentinel-muted">{tCommon("loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-sentinel-surface min-h-[calc(100vh-4rem)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-white tracking-tight">{t("title")}</h2>
          <p className="text-sm text-sentinel-muted leading-relaxed">
            {t("subtitle")}
          </p>
        </div>
        <div className="mb-8">
          <SearchBar
            value={query}
            onChange={setQuery}
            isLoading={isLoading}
          />
        </div>
        <GuestList
          guests={guests}
          isLoading={isLoading}
          query={debouncedQuery}
          hasSearched={hasSearched}
        />
      </div>
    </div>
  );
}
