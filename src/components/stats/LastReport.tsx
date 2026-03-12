"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface LastReportData {
  id: string;
  guest_id: string;
  guest_name: string;
  reporter_name: string;
  incident_type: string;
  incident_date: string | null;
  severity: number;
  description: string;
  property_name: string | null;
  platform: string | null;
  created_at: string;
}

interface LastReportProps {
  report: LastReportData | null;
  title: string;
  incidentLabel: (type: string) => string;
}

const INCIDENT_COLORS: Record<string, string> = {
  damage: "bg-red-500/20 text-red-400 border-red-500/30",
  theft: "bg-red-500/20 text-red-400 border-red-500/30",
  fraud: "bg-red-500/20 text-red-400 border-red-500/30",
  noise: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  no_show: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  other: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

export function LastReport({ report, title, incidentLabel }: LastReportProps) {
  if (!report) return null;

  const colorClass = INCIDENT_COLORS[report.incident_type] || INCIDENT_COLORS.other;

  return (
    <Card className="bg-sentinel-card border-sentinel-border border-l-4 border-l-sentinel-accent rounded-2xl card-hover">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-white tracking-tight">
          <Clock className="size-4 text-sentinel-accent" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Link
            href={`/guest/${report.guest_id}` as "/dashboard"}
            className="font-medium text-sentinel-accent hover:text-amber-400 hover:underline transition-colors duration-200"
          >
            {report.guest_name}
          </Link>
          <Badge variant="outline" className={`text-xs w-fit ${colorClass}`}>
            {incidentLabel(report.incident_type)}
          </Badge>
          <span className="text-sm text-sentinel-muted">
            {timeAgo(report.created_at)}
          </span>
        </div>
        <p className="text-sm text-sentinel-muted mt-1.5 line-clamp-2 leading-relaxed">
          {report.description}
        </p>
        <p className="text-xs text-sentinel-muted/70 mt-1.5">
          by {report.reporter_name}
          {report.property_name ? ` · ${report.property_name}` : ""}
        </p>
      </CardContent>
    </Card>
  );
}
