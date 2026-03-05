"use client";

import { Search, Users } from "lucide-react";
import { GuestCard, type Guest } from "./GuestCard";

interface GuestListProps {
  guests: Guest[];
  isLoading: boolean;
  query: string;
  hasSearched: boolean;
}

export function GuestList({ guests, isLoading, query, hasSearched }: GuestListProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent mb-3" />
        <p className="text-sm">Searching guests...</p>
      </div>
    );
  }

  // Initial state - no search performed yet
  if (!hasSearched) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Search className="size-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">Search for a guest</p>
        <p className="text-xs mt-1">Enter at least 2 characters to start searching</p>
      </div>
    );
  }

  // Empty results
  if (guests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Users className="size-10 mb-3 opacity-40" />
        <p className="text-sm font-medium">No guests found</p>
        <p className="text-xs mt-1">
          No results for &ldquo;{query}&rdquo;. Try a different search term.
        </p>
      </div>
    );
  }

  // Results
  return (
    <div>
      <p className="text-sm text-muted-foreground mb-3">
        {guests.length} {guests.length === 1 ? "result" : "results"} for &ldquo;{query}&rdquo;
      </p>
      <div className="flex flex-col gap-2">
        {guests.map((guest) => (
          <GuestCard key={guest.id} guest={guest} />
        ))}
      </div>
    </div>
  );
}
