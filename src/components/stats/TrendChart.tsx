"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TrendChartProps {
  data: { date: string; count: number }[];
  title: string;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return `${d.getUTCDate()}.${d.getUTCMonth() + 1}.`;
}

interface TooltipPayloadEntry {
  value: number;
  payload: { date: string; count: number };
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
}) {
  if (active && payload && payload.length > 0) {
    const entry = payload[0];
    return (
      <div className="bg-sentinel-card border border-sentinel-border/50 rounded-xl px-4 py-2.5 shadow-xl shadow-black/30">
        <p className="text-xs text-sentinel-muted">{formatDateLabel(entry.payload.date)}</p>
        <p className="text-lg font-bold text-white">{entry.value}</p>
      </div>
    );
  }
  return null;
}

export function TrendChart({ data, title }: TrendChartProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const yMax = Math.ceil(maxCount * 1.2) || 5;

  return (
    <Card className="bg-sentinel-card border-sentinel-border rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-white tracking-tight">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D2D3F" strokeOpacity={0.5} />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateLabel}
                stroke="#9CA3AF"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                interval="preserveStartEnd"
                tickCount={7}
              />
              <YAxis
                domain={[0, yMax]}
                allowDecimals={false}
                stroke="#9CA3AF"
                tick={{ fontSize: 11, fill: "#9CA3AF" }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#F59E0B"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, fill: "#F59E0B", stroke: "#0A0A0A", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
