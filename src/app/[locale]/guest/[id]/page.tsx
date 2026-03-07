"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuthContext } from "@/app/providers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  ArrowLeft,
  AlertTriangle,
  Mail,
  Phone,
  Calendar,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  Flag,
  Pencil,
} from "lucide-react";
import PhotoGallery from "@/components/report/PhotoGallery";

interface GuestData {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  reports_count: number;
  created_at: string;
}

interface ReportData {
  id: string;
  incident_type: string;
  incident_date: string;
  severity: number;
  description: string;
  property_name: string | null;
  platform: string;
  photo_urls: string[];
  created_at: string;
  reporter: string;
  reporter_id: string;
}

const INCIDENT_COLORS: Record<string, string> = {
  damage: "bg-red-500/20 text-red-400 border-red-500/30",
  theft: "bg-red-500/20 text-red-400 border-red-500/30",
  fraud: "bg-red-500/20 text-red-400 border-red-500/30",
  noise: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  no_show: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  other: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const PLATFORM_COLORS: Record<string, string> = {
  airbnb: "bg-pink-500/20 text-pink-400",
  booking: "bg-blue-500/20 text-blue-400",
  direct: "bg-green-500/20 text-green-400",
  other: "bg-gray-500/20 text-gray-400",
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

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("sk-SK", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function ReportCard({
  report,
  currentUserId,
}: {
  report: ReportData;
  currentUserId: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const t = useTranslations("guest");
  const tIncident = useTranslations("incidentTypes");
  const tPlatform = useTranslations("platforms");
  const tCommon = useTranslations("common");

  const incidentColor =
    INCIDENT_COLORS[report.incident_type] || INCIDENT_COLORS.other;
  const platformKey = report.platform?.toLowerCase() || "other";
  const platformColor = PLATFORM_COLORS[platformKey] || PLATFORM_COLORS.other;

  const needsTruncation = report.description && report.description.length > 200;
  const displayDescription =
    needsTruncation && !expanded
      ? report.description.slice(0, 200) + "…"
      : report.description;

  const isOwnReport = currentUserId === report.reporter_id;

  async function handleFlagSubmit() {
    if (flagReason.trim().length < 10) return;

    setFlagSubmitting(true);
    try {
      const res = await fetch("/api/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_id: report.id,
          reason: flagReason.trim(),
        }),
      });

      if (res.status === 409) {
        toast("error", t("flagAlreadySubmitted"));
        setFlagDialogOpen(false);
        setFlagReason("");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast("error", data.error || tCommon("error"));
        return;
      }

      toast("success", t("flagThankYou"));
      setFlagDialogOpen(false);
      setFlagReason("");
    } catch {
      toast("error", tCommon("error"));
    } finally {
      setFlagSubmitting(false);
    }
  }

  return (
    <>
      <Card className="py-0 overflow-hidden bg-sentinel-card border-sentinel-border">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-xs font-medium ${incidentColor}`}
              >
                {tIncident(report.incident_type as "damage" | "theft" | "noise" | "fraud" | "no_show" | "other")}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs font-medium ${platformColor}`}
              >
                {tPlatform(platformKey as "airbnb" | "booking" | "direct" | "other")}
              </Badge>
            </div>
            <SeverityDots severity={report.severity} />
          </div>

          <div className="flex items-center gap-1.5 text-sm text-sentinel-muted mb-2">
            <Calendar className="size-3.5 shrink-0" />
            <span>{formatDate(report.incident_date)}</span>
          </div>

          {report.description && (
            <div className="mb-2">
              <p className="text-sm text-sentinel-text leading-relaxed">
                {displayDescription}
              </p>
              {needsTruncation && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="flex items-center gap-1 text-xs text-sentinel-accent hover:text-amber-400 mt-1 font-medium"
                >
                  {expanded ? (
                    <>
                      {t("showLess")} <ChevronUp className="size-3" />
                    </>
                  ) : (
                    <>
                      {t("readMore")} <ChevronDown className="size-3" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Photos */}
          {report.photo_urls && report.photo_urls.length > 0 && (
            <PhotoGallery photos={report.photo_urls} />
          )}

          <div className="flex items-center justify-between text-xs text-sentinel-muted pt-2 border-t border-sentinel-border">
            <div className="flex items-center gap-1.5">
              <User className="size-3 shrink-0" />
              <span>{report.reporter}</span>
            </div>
            <div className="flex items-center gap-2">
              {report.property_name && (
                <span className="truncate max-w-[200px]">
                  {report.property_name}
                </span>
              )}
              {currentUserId && isOwnReport && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-sentinel-muted hover:text-sentinel-accent"
                  asChild
                >
                  <Link href={`/report/${report.id}/edit` as "/dashboard"}>
                    <Pencil className="size-3 mr-1" />
                    {tCommon("edit")}
                  </Link>
                </Button>
              )}
              {currentUserId && !isOwnReport && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-sentinel-muted hover:text-red-400"
                  onClick={() => setFlagDialogOpen(true)}
                >
                  <Flag className="size-3 mr-1" />
                  {t("reportAsFalse")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent className="sm:max-w-md bg-sentinel-card border-sentinel-border">
          <DialogHeader>
            <DialogTitle className="text-white">{t("reportAsFalseTitle")}</DialogTitle>
            <DialogDescription className="text-sentinel-muted">
              {t("reportAsFalseDesc")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <textarea
              className="w-full min-h-[100px] rounded-md border border-sentinel-border bg-sentinel-bg px-3 py-2 text-sm text-white placeholder:text-sentinel-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sentinel-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sentinel-card disabled:cursor-not-allowed disabled:opacity-50 resize-y"
              placeholder={t("flagReasonPlaceholder")}
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              disabled={flagSubmitting}
            />
            {flagReason.length > 0 && flagReason.trim().length < 10 && (
              <p className="text-xs text-red-400 mt-1">
                {t("flagMinChars", { count: flagReason.trim().length })}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-sentinel-border text-sentinel-text hover:bg-sentinel-card"
              onClick={() => {
                setFlagDialogOpen(false);
                setFlagReason("");
              }}
              disabled={flagSubmitting}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleFlagSubmit}
              disabled={flagSubmitting || flagReason.trim().length < 10}
            >
              {flagSubmitting ? t("flagSubmitting") : tCommon("submit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function GuestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const [guest, setGuest] = useState<GuestData | null>(null);
  const [reports, setReports] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("guest");
  const tSearch = useTranslations("search");

  const guestId = params.id as string;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirectTo=/guest/${guestId}` as "/login");
      return;
    }

    async function fetchGuest() {
      try {
        const res = await fetch(`/api/guests/${guestId}`);
        if (res.status === 401) {
          router.push(`/login?redirectTo=/guest/${guestId}` as "/login");
          return;
        }
        if (res.status === 404) {
          setError(t("notFound"));
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError(t("notFound"));
          setLoading(false);
          return;
        }
        const data = await res.json();
        setGuest(data.guest);
        setReports(data.reports || []);
      } catch {
        setError(t("notFound"));
      } finally {
        setLoading(false);
      }
    }

    fetchGuest();
  }, [guestId, user, authLoading, router, t]);

  if (authLoading || (loading && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sentinel-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-sentinel-muted border-t-transparent" />
          <p className="text-sm text-sentinel-muted">{t("loadingDetails")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sentinel-surface">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/search")}
            className="mb-6 text-sentinel-muted hover:text-white"
          >
            <ArrowLeft className="size-4 mr-1.5" />
            {t("backToSearch")}
          </Button>
          <div className="flex flex-col items-center justify-center py-16 text-sentinel-muted">
            <AlertTriangle className="size-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!guest) return null;

  const reportsLabel =
    guest.reports_count === 1
      ? t("reportSingle")
      : guest.reports_count >= 2 && guest.reports_count <= 4
        ? t("reportFew")
        : t("reportMany");

  return (
    <div className="min-h-screen bg-sentinel-surface">
      <header className="bg-sentinel-bg border-b border-sentinel-border">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/search")}
            className="text-sentinel-muted hover:text-white"
          >
            <ArrowLeft className="size-4 mr-1.5" />
            {t("backToSearch")}
          </Button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Guest Info */}
        <Card className="mb-6 py-0 overflow-hidden bg-sentinel-card border-sentinel-border">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-sentinel-border">
                <User className="size-5 text-sentinel-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold truncate text-white">
                  {guest.full_name}
                </h1>
                <div className="flex flex-col gap-1 mt-2">
                  <div className="flex items-center gap-1.5 text-sm text-sentinel-muted">
                    <Mail className="size-3.5 shrink-0" />
                    <span>{guest.email}</span>
                  </div>
                  {guest.phone && (
                    <div className="flex items-center gap-1.5 text-sm text-sentinel-muted">
                      <Phone className="size-3.5 shrink-0" />
                      <span>{guest.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`flex items-center gap-1.5 shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
                  guest.reports_count === 0
                    ? "text-green-400 bg-green-500/10 border-green-500/30"
                    : guest.reports_count <= 2
                      ? "text-yellow-400 bg-yellow-500/10 border-yellow-500/30"
                      : "text-red-400 bg-red-500/10 border-red-500/30"
                }`}
              >
                <AlertTriangle className="size-3.5" />
                {guest.reports_count} {reportsLabel}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports Section */}
        <div className="mb-4 flex items-center gap-2">
          <FileText className="size-4 text-sentinel-muted" />
          <h2 className="text-lg font-semibold text-white">{t("reports")}</h2>
        </div>

        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-sentinel-muted">
            <FileText className="size-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">{t("noReports")}</p>
            <p className="text-xs mt-1">
              {t("noReportsDesc")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                currentUserId={user?.id ?? null}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
