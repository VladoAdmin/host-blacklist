"use client";

import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}

export function SearchBar({ value, onChange, isLoading }: SearchBarProps) {
  const t = useTranslations("search");

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-sentinel-muted" />
      <Input
        type="text"
        placeholder={t("placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-12 pr-12 h-13 text-base bg-sentinel-card border-sentinel-border text-white placeholder:text-sentinel-muted rounded-xl focus:ring-2 focus:ring-sentinel-accent/50 focus:border-sentinel-accent transition-all duration-200"
        autoFocus
      />
      {value && !isLoading && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sentinel-muted hover:text-white transition-colors duration-200"
          onClick={() => onChange("")}
          aria-label={t("clearSearch")}
        >
          <X className="size-4" />
        </Button>
      )}
      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <div className="size-4 animate-spin rounded-full border-2 border-sentinel-muted border-t-sentinel-accent" />
        </div>
      )}
    </div>
  );
}
