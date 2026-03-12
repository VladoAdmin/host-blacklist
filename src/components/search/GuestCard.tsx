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
    <Link href={`/guest/${guest.id}` as "/dashboard"} className="block group">
    <Card className="py-0 overflow-hidden cursor-pointer bg-sentinel-card border-sentinel-border card-hover rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-sentinel-border/50 group-hover:bg-sentinel-accent/10 transition-colors duration-300">
              <User className="size-4 text-sentinel-muted group-hover:text-sentinel-accent transition-colors duration-300" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold truncate text-white group-hover:text-sentinel-accent transition-colors duration-200">{guest.full_name}</h3>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-sentinel-muted">
                <Mail className="size-3 shrink-0" />
                <span className="truncate">{guest.email}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-sentinel-muted/70">
                  {matchLabel} ({matchPercent}%)
                </span>
              </div>
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${severityClasses}`}
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
