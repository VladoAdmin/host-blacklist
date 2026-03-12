"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

interface TopReporter {
  reporter_id: string;
  full_name: string;
  report_count: number;
}

interface TopReportersProps {
  reporters: TopReporter[];
  title: string;
  reportsLabel: string;
}

const RANK_COLORS = [
  "text-amber-400",
  "text-gray-300",
  "text-amber-600",
  "text-sentinel-muted",
  "text-sentinel-muted",
];

export function TopReporters({ reporters, title, reportsLabel }: TopReportersProps) {
  return (
    <Card className="bg-sentinel-card border-sentinel-border">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-white">
          <Trophy className="size-4 text-amber-400" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        {reporters.length === 0 ? (
          <p className="text-sm text-sentinel-muted">—</p>
        ) : (
          <div className="space-y-3">
            {reporters.map((reporter, idx) => (
              <div key={reporter.reporter_id} className="flex items-center gap-3">
                <span className={`text-lg font-bold w-6 text-center ${RANK_COLORS[idx] || RANK_COLORS[4]}`}>
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {reporter.full_name}
                  </p>
                </div>
                <span className="text-sm text-sentinel-muted whitespace-nowrap">
                  {reporter.report_count} {reportsLabel}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
