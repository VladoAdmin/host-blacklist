"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/app/providers";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { SearchBar } from "@/components/search/SearchBar";
import { GuestList } from "@/components/search/GuestList";
import { Button } from "@/components/ui/button";
import type { Guest } from "@/components/search/GuestCard";

export default function SearchPage() {
  const { user, profile, signOut, loading: authLoading } = useAuthContext();
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [guests, setGuests] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

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
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Host Blacklist</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              {profile?.full_name || user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-1">Search Guests</h2>
          <p className="text-sm text-muted-foreground">
            Look up guests by name or email to check their history.
          </p>
        </div>
        <div className="mb-6">
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
      </main>
    </div>
  );
}
