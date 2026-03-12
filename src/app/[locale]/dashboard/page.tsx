"use client";

import { useAuthContext } from "@/app/providers";
import { useEffect, useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  FileText,
  Users,
  Plus,
  Search,
  Pencil,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  Calendar,
} from "lucide-react";
import { StatsCard } from "@/components/stats/StatsCard";
import { TrendChart } from "@/components/stats/TrendChart";
import { TopReporters } from "@/components/stats/TopReporters";
import { LastReport } from "@/components/stats/LastReport";

// --- Shared helpers ---

const INCIDENT_COLORS: Record<string, string> = {
  damage: "bg-red-500/20 text-red-400 border-red-500/30",
  theft: "bg-red-500/20 text-red-400 border-red-500/30",
  fraud: "bg-red-500/20 text-red-400 border-red-500/30",
  noise: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  no_show: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  other: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

function SeverityDots({ severity }: { severity: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`inline-block size-2.5 rounded-full transition-colors duration-200 ${
            i < severity ? "bg-red-500" : "bg-sentinel-border"
          }`}
        />
      ))}
    </div>
  );
}

// --- Types ---

interface DashboardReport {
  id: string;
  guest_id: string;
  guest_name: string;
  incident_type: string;
  incident_date: string | null;
  severity: number;
  description: string;
  property_name: string | null;
  platform: string | null;
  created_at: string;
}

interface LastGlobalReport {
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

interface TopReporterData {
  reporter_id: string;
  full_name: string;
  report_count: number;
}

interface TrendDataPoint {
  date: string;
  count: number;
}

interface DashboardData {
  my_reports: DashboardReport[];
  stats: {
    total_guests: number;
    my_reports_count: number;
    reports_today: number;
    reports_this_week: number;
    reports_this_month: number;
    reports_this_year: number;
  };
  last_global_report: LastGlobalReport | null;
  top_reporters: TopReporterData[];
  trend_data: TrendDataPoint[];
}

// --- Skeleton loader ---

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 skeleton-shimmer rounded-lg" />
      <div className="h-24 skeleton-shimmer rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[84px] skeleton-shimmer rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 skeleton-shimmer rounded-2xl" />
        ))}
      </div>
      <div className="h-[300px] skeleton-shimmer rounded-2xl" />
      <div className="h-14 skeleton-shimmer rounded-2xl" />
      <div className="space-y-3">
        <div className="h-6 w-48 skeleton-shimmer rounded-lg" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 skeleton-shimmer rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// --- Main component ---

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuthContext();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const t = useTranslations("dashboard");
  const tStats = useTranslations("stats");
  const tIncident = useTranslations("incidentTypes");

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to load dashboard");
        }
        const json: DashboardData = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setDataLoading(false);
      }
    }

    fetchDashboard();
  }, [authLoading, user]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}` as "/search");
    }
  }

  if (authLoading || dataLoading) {
    return (
      <div className="bg-sentinel-surface min-h-[calc(100vh-4rem)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-sentinel-surface min-h-[calc(100vh-4rem)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats ?? {
    total_guests: 0,
    my_reports_count: 0,
    reports_today: 0,
    reports_this_week: 0,
    reports_this_month: 0,
    reports_this_year: 0,
  };
  const reports = data?.my_reports ?? [];
  const lastGlobalReport = data?.last_global_report ?? null;
  const topReporters = data?.top_reporters ?? [];
  const trendData = data?.trend_data ?? [];

  return (
    <div className="bg-sentinel-surface min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {t("welcomeBack", { name: profile?.full_name || "User" })}
        </h1>

        {/* Last global report highlight */}
        <LastReport
          report={lastGlobalReport}
          title={tStats("lastReport")}
          incidentLabel={(type) =>
            tIncident(type as "damage" | "theft" | "noise" | "fraud" | "no_show" | "other")
          }
        />

        {/* Period stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            label={tStats("today")}
            value={stats.reports_today}
            icon={CalendarDays}
            colorClass="bg-emerald-500/15 text-emerald-400"
          />
          <StatsCard
            label={tStats("thisWeek")}
            value={stats.reports_this_week}
            icon={CalendarRange}
            colorClass="bg-blue-500/15 text-blue-400"
          />
          <StatsCard
            label={tStats("thisMonth")}
            value={stats.reports_this_month}
            icon={CalendarClock}
            colorClass="bg-purple-500/15 text-purple-400"
          />
          <StatsCard
            label={tStats("thisYear")}
            value={stats.reports_this_year}
            icon={Calendar}
            colorClass="bg-amber-500/15 text-amber-400"
          />
        </div>

        {/* Original stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-sentinel-card border-sentinel-border card-hover rounded-2xl">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
                <FileText className="size-6" />
              </div>
              <div>
                <p className="text-sm text-sentinel-muted">{t("myReports")}</p>
                <p className="text-3xl font-bold text-white tracking-tight">
                  {stats.my_reports_count}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-sentinel-card border-sentinel-border card-hover rounded-2xl">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
                <Users className="size-6" />
              </div>
              <div>
                <p className="text-sm text-sentinel-muted">{t("totalGuests")}</p>
                <p className="text-3xl font-bold text-white tracking-tight">
                  {stats.total_guests}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-sentinel-accent border-sentinel-accent rounded-2xl group hover:brightness-110 transition-all duration-300">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-black/20">
                <Plus className="size-6 text-black" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-black/70">{t("quickAction")}</p>
                <Link href="/report/new">
                  <Button
                    variant="secondary"
                    className="mt-1 bg-black text-sentinel-accent hover:bg-gray-900 px-5 py-2 transition-all duration-200"
                  >
                    {t("addReport")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trend chart + Top reporters side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <TrendChart data={trendData} title={tStats("trendTitle")} />
          </div>
          <div>
            <TopReporters
              reporters={topReporters}
              title={tStats("topReporters")}
              reportsLabel={tStats("reports")}
            />
          </div>
        </div>

        {/* Quick search */}
        <Card className="bg-sentinel-card border-sentinel-border rounded-2xl card-hover">
          <CardContent className="p-5">
            <form onSubmit={handleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-sentinel-muted" />
                <Input
                  type="text"
                  placeholder={t("quickSearch")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 bg-sentinel-surface border-sentinel-border text-white placeholder:text-sentinel-muted rounded-xl focus:ring-2 focus:ring-sentinel-accent/50 focus:border-sentinel-accent transition-all duration-200"
                />
              </div>
              <Button type="submit" className="bg-sentinel-accent text-black hover:brightness-110 font-semibold px-6 h-12 rounded-xl transition-all duration-200">
                {t("myReports").split(" ")[0] === "Moje" ? "Hľadať" : "Search"}
              </Button>
            </form>
            <Link
              href="/search"
              className="inline-flex items-center gap-1 mt-3 text-sm text-sentinel-accent hover:text-amber-400 transition-colors duration-200"
            >
              {t("goToFullSearch")}
              <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>

        {/* My Recent Reports */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 tracking-tight">
            {t("myRecentReports")}
          </h2>

          {reports.length === 0 ? (
            <Card className="bg-sentinel-card border-sentinel-border rounded-2xl">
              <CardContent className="p-10 text-center">
                <FileText className="mx-auto size-10 text-sentinel-border mb-4" />
                <p className="text-sentinel-muted mb-5">
                  {t("noReportsYet")}
                </p>
                <Link href="/report/new">
                  <Button className="bg-sentinel-accent text-black hover:brightness-110 font-semibold px-6 py-3 transition-all duration-200">{t("addReport")}</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const incidentColor =
                  INCIDENT_COLORS[report.incident_type] ||
                  INCIDENT_COLORS.other;
                const dateStr = report.incident_date
                  ? new Date(report.incident_date).toLocaleDateString()
                  : new Date(report.created_at).toLocaleDateString();

                return (
                  <Card key={report.id} className="bg-sentinel-card border-sentinel-border card-hover rounded-2xl">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <Link
                              href={`/guest/${report.guest_id}` as "/dashboard"}
                              className="font-medium text-sentinel-accent hover:text-amber-400 hover:underline truncate transition-colors duration-200"
                            >
                              {report.guest_name}
                            </Link>
                            <Badge
                              variant="outline"
                              className={`text-xs ${incidentColor}`}
                            >
                              {tIncident(report.incident_type as "damage" | "theft" | "noise" | "fraud" | "no_show" | "other")}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-sentinel-muted">
                            <span>{dateStr}</span>
                            {report.property_name && (
                              <span className="truncate">
                                {report.property_name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <SeverityDots severity={report.severity} />
                          <Link href={`/report/${report.id}/edit` as "/dashboard"}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-sentinel-muted hover:text-white hover:bg-sentinel-card transition-all duration-200"
                            >
                              <Pencil className="size-4" />
                              <span className="sr-only">{t("editReport")}</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
