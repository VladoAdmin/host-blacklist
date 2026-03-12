"use client";

import { Card, CardContent } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass?: string;
}

export function StatsCard({ label, value, icon: Icon, colorClass = "bg-blue-500/15 text-blue-400" }: StatsCardProps) {
  return (
    <Card className="bg-sentinel-card border-sentinel-border">
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-sentinel-muted truncate">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
