"use client";

import { useAuthContext } from "@/app/providers";
import { useEffect, useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Users, Plus, Search, Pencil, ArrowRight } from "lucide-react";

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
          className={`inline-block size-2.5 rounded-full ${
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

interface DashboardData {
  my_reports: DashboardReport[];
  stats: {
    total_guests: number;
    my_reports_count: number;
  };
}

// --- Skeleton loader ---

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-sentinel-card rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-sentinel-card rounded-lg" />
        ))}
      </div>
      <div className="h-12 bg-sentinel-card rounded-lg" />
      <div className="space-y-3">
        <div className="h-6 w-48 bg-sentinel-card rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-sentinel-card rounded-lg" />
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
        <div className="max-w-6xl mx-auto px-4 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-sentinel-surface min-h-[calc(100vh-4rem)]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats ?? { total_guests: 0, my_reports_count: 0 };
  const reports = data?.my_reports ?? [];

  return (
    <div className="bg-sentinel-surface min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome */}
        <h1 className="text-2xl font-bold text-white">
          {t("welcomeBack", { name: profile?.full_name || "User" })}
        </h1>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="bg-sentinel-card border-sentinel-border">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
                <FileText className="size-6" />
              </div>
              <div>
                <p className="text-sm text-sentinel-muted">{t("myReports")}</p>
                <p className="text-3xl font-bold text-white">
                  {stats.my_reports_count}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-sentinel-card border-sentinel-border">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-400">
                <Users className="size-6" />
              </div>
              <div>
                <p className="text-sm text-sentinel-muted">{t("totalGuests")}</p>
                <p className="text-3xl font-bold text-white">
                  {stats.total_guests}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-sentinel-accent border-sentinel-accent">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-black/20">
                <Plus className="size-6 text-black" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-black/70">{t("quickAction")}</p>
                <Link href="/report/new">
                  <Button
                    variant="secondary"
                    className="mt-1 bg-black text-sentinel-accent hover:bg-gray-900"
                  >
                    {t("addReport")}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick search */}
        <Card className="bg-sentinel-card border-sentinel-border">
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-sentinel-muted" />
                <Input
                  type="text"
                  placeholder={t("quickSearch")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-sentinel-bg border-sentinel-border text-white placeholder:text-sentinel-muted"
                />
              </div>
              <Button type="submit" className="bg-sentinel-accent text-black hover:bg-amber-400 font-semibold">
                {t("myReports").split(" ")[0] === "Moje" ? "Hľadať" : "Search"}
              </Button>
            </form>
            <Link
              href="/search"
              className="inline-flex items-center gap-1 mt-2 text-sm text-sentinel-accent hover:text-amber-400"
            >
              {t("goToFullSearch")}
              <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>

        {/* My Recent Reports */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            {t("myRecentReports")}
          </h2>

          {reports.length === 0 ? (
            <Card className="bg-sentinel-card border-sentinel-border">
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto size-10 text-sentinel-border mb-3" />
                <p className="text-sentinel-muted mb-4">
                  {t("noReportsYet")}
                </p>
                <Link href="/report/new">
                  <Button className="bg-sentinel-accent text-black hover:bg-amber-400 font-semibold">{t("addReport")}</Button>
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
                  <Card key={report.id} className="bg-sentinel-card border-sentinel-border hover:border-sentinel-accent/30 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Link
                              href={`/guest/${report.guest_id}` as "/dashboard"}
                              className="font-medium text-sentinel-accent hover:text-amber-400 hover:underline truncate"
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
                              className="text-sentinel-muted hover:text-white"
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
