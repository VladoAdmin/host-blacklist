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
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-sentinel-muted" />
      <Input
        type="text"
        placeholder={t("placeholder")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10 h-11 text-base bg-sentinel-card border-sentinel-border text-white placeholder:text-sentinel-muted"
        autoFocus
      />
      {value && !isLoading && (
        <Button
          variant="ghost"
          size="icon-xs"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-sentinel-muted hover:text-white"
          onClick={() => onChange("")}
          aria-label={t("clearSearch")}
        >
          <X className="size-3.5" />
        </Button>
      )}
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="size-4 animate-spin rounded-full border-2 border-sentinel-muted border-t-transparent" />
        </div>
      )}
    </div>
  );
}
