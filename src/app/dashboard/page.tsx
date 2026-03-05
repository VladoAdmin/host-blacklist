"use client";

import { useAuthContext } from "@/app/providers";
import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { FileText, Users, Plus, Search, Pencil, ArrowRight } from "lucide-react";

// --- Shared helpers (same as guest detail page) ---

const INCIDENT_COLORS: Record<string, string> = {
  damage: "bg-red-100 text-red-800 border-red-200",
  theft: "bg-red-100 text-red-800 border-red-200",
  fraud: "bg-red-100 text-red-800 border-red-200",
  noise: "bg-yellow-100 text-yellow-800 border-yellow-200",
  no_show: "bg-gray-100 text-gray-800 border-gray-200",
  other: "bg-blue-100 text-blue-800 border-blue-200",
};

function formatIncidentType(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function SeverityDots({ severity }: { severity: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`inline-block size-2.5 rounded-full ${
            i < severity ? "bg-red-500" : "bg-gray-200"
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
      {/* Welcome */}
      <div className="h-8 w-64 bg-gray-200 rounded" />

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-lg" />
        ))}
      </div>

      {/* Search */}
      <div className="h-12 bg-gray-200 rounded-lg" />

      {/* Reports */}
      <div className="space-y-3">
        <div className="h-6 w-48 bg-gray-200 rounded" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg" />
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
      router.push(`/search?q=${encodeURIComponent(q)}`);
    }
  }

  if (authLoading || dataLoading) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        </div>
      </div>
    );
  }

  const stats = data?.stats ?? { total_guests: 0, my_reports_count: 0 };
  const reports = data?.my_reports ?? [];

  return (
    <div className="bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Welcome */}
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.full_name || "User"}
        </h1>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* My Reports */}
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <FileText className="size-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">My Reports</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.my_reports_count}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Guests */}
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <Users className="size-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Guests in DB</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.total_guests}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Add Report */}
          <Card className="bg-blue-600 text-white border-blue-600">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-blue-500">
                <Plus className="size-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-blue-100">Quick Action</p>
                <Link href="/report/new">
                  <Button
                    variant="secondary"
                    className="mt-1 bg-white text-blue-600 hover:bg-blue-50"
                  >
                    Add Report
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick search */}
        <Card>
          <CardContent className="p-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Quick search guests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button type="submit" variant="default">
                Search
              </Button>
            </form>
            <Link
              href="/search"
              className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Go to full search
              <ArrowRight className="size-3" />
            </Link>
          </CardContent>
        </Card>

        {/* My Recent Reports */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            My Recent Reports
          </h2>

          {reports.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto size-10 text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">
                  No reports yet. Add your first report!
                </p>
                <Link href="/report/new">
                  <Button>Add Report</Button>
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
                  <Card key={report.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Guest name + incident badge */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <Link
                              href={`/guest/${report.guest_id}`}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate"
                            >
                              {report.guest_name}
                            </Link>
                            <Badge
                              variant="outline"
                              className={`text-xs ${incidentColor}`}
                            >
                              {formatIncidentType(report.incident_type)}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                            <span>{dateStr}</span>
                            {report.property_name && (
                              <span className="truncate">
                                {report.property_name}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Severity + edit */}
                        <div className="flex items-center gap-3 shrink-0">
                          <SeverityDots severity={report.severity} />
                          <Link href={`/report/${report.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Pencil className="size-4" />
                              <span className="sr-only">Edit report</span>
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
