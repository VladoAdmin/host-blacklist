"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AlertTriangle, Mail, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface Guest {
  id: string;
  full_name: string;
  email: string;
  similarity_score: number;
  reports_count: number;
}

interface GuestCardProps {
  guest: Guest;
}

function getSeverityColor(reportsCount: number) {
  if (reportsCount === 0) return "text-green-400 bg-green-500/10 border-green-500/30";
  if (reportsCount <= 2) return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
  return "text-red-400 bg-red-500/10 border-red-500/30";
}

export function GuestCard({ guest }: GuestCardProps) {
  const t = useTranslations("search");
  const severityClasses = getSeverityColor(guest.reports_count);

  function getMatchLabel(score: number) {
    if (score >= 0.9) return t("exactMatch");
    if (score >= 0.5) return t("closeMatch");
    return t("partialMatch");
  }

  const matchLabel = getMatchLabel(guest.similarity_score);
  const matchPercent = Math.round(guest.similarity_score * 100);

  return (
    <Link href={`/guest/${guest.id}` as "/dashboard"} className="block">
    <Card className="transition-colors hover:border-sentinel-accent/30 py-0 overflow-hidden cursor-pointer bg-sentinel-card border-sentinel-border">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-sentinel-border">
              <User className="size-4 text-sentinel-muted" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate text-white">{guest.full_name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-sm text-sentinel-muted">
                <Mail className="size-3 shrink-0" />
                <span className="truncate">{guest.email}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-sentinel-muted">
                  {matchLabel} ({matchPercent}%)
                </span>
              </div>
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${severityClasses}`}
          >
            <AlertTriangle className="size-3" />
            {t("reportCount", { count: guest.reports_count })}
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
