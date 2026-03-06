"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAuthContext } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { INCIDENT_TYPES, PLATFORMS, SEVERITY_LABELS } from "@/lib/constants";
import { AlertTriangle, Loader2, Trash2, User } from "lucide-react";

interface ReportData {
  id: string;
  guest_id: string;
  reporter_id: string;
  incident_type: string;
  incident_date: string | null;
  severity: number;
  description: string;
  property_name: string | null;
  platform: string | null;
}

interface GuestInfo {
  full_name: string;
  email: string | null;
}

export default function EditReportPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();
  const t = useTranslations("report");
  const tIncident = useTranslations("incidentTypes");
  const tPlatform = useTranslations("platforms");
  const tSeverity = useTranslations("severityLabels");
  const tCommon = useTranslations("common");

  const reportId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [guest, setGuest] = useState<GuestInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [incidentType, setIncidentType] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [platform, setPlatform] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push(`/login?redirectTo=/report/${reportId}/edit` as "/login");
      return;
    }

    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${reportId}`);

        if (res.status === 401) {
          router.push(`/login?redirectTo=/report/${reportId}/edit` as "/login");
          return;
        }
        if (res.status === 403) {
          setError(t("editPermission"));
          setLoading(false);
          return;
        }
        if (res.status === 404) {
          setError(t("notFoundError"));
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError(tCommon("error"));
          setLoading(false);
          return;
        }

        const data = await res.json();
        const r = data.report as ReportData;
        setReport(r);
        setGuest(data.guest);

        setIncidentType(r.incident_type);
        setIncidentDate(r.incident_date || "");
        setSeverity(r.severity);
        setDescription(r.description);
        setPropertyName(r.property_name || "");
        setPlatform(r.platform || "");
      } catch {
        setError(tCommon("error"));
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [reportId, user, authLoading, router, t, tCommon]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!incidentType) {
      setFormError(t("incidentTypeRequired"));
      return;
    }
    if (description.trim().length < 10) {
      setFormError(t("descriptionMinError"));
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incident_type: incidentType,
          incident_date: incidentDate || undefined,
          severity,
          description: description.trim(),
          property_name: propertyName.trim() || undefined,
          platform: platform || undefined,
        }),
      });

      if (res.status === 403) {
        setFormError(t("editPermission"));
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || tCommon("error"));
        return;
      }

      toast("success", t("updateSuccess"));
      router.push("/dashboard");
    } catch {
      setFormError(tCommon("error"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);

    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      if (res.status === 403) {
        toast("error", t("deletePermission"));
        setDeleteDialogOpen(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast("error", data.error || tCommon("error"));
        return;
      }

      toast("success", t("deleteSuccess"));
      router.push("/dashboard");
    } catch {
      toast("error", tCommon("error"));
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  if (authLoading || (loading && !error)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t("loadingReport")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <AlertTriangle className="size-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push("/dashboard")}
            >
              {t("backToDashboard")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t("editTitle")}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("editSubtitle")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="size-4 mr-1.5" />
            {tCommon("delete")}
          </Button>
        </div>

        {guest && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
            <User className="size-4 text-muted-foreground shrink-0" />
            <div className="text-sm">
              <span className="font-medium">{guest.full_name}</span>
              {guest.email && (
                <span className="text-muted-foreground ml-2">
                  ({guest.email})
                </span>
              )}
            </div>
          </div>
        )}

        {formError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle className="size-5 shrink-0 text-red-500 mt-0.5" />
            <p className="text-sm text-red-800">{formError}</p>
          </div>
        )}

        <Card className="py-0 overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Incident Details */}
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  {t("incidentDetails")}
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="incident_type">
                        {t("incidentType")} <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={incidentType}
                        onValueChange={setIncidentType}
                      >
                        <SelectTrigger id="incident_type" className="mt-1.5">
                          <SelectValue placeholder={t("incidentTypePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent>
                          {INCIDENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {tIncident(type.value as "damage" | "theft" | "noise" | "fraud" | "no_show" | "other")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="incident_date">{t("incidentDate")}</Label>
                      <Input
                        id="incident_date"
                        type="date"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>{t("severity")}</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {SEVERITY_LABELS.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setSeverity(s.value)}
                          className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-xs transition-colors ${
                            severity === s.value
                              ? s.value <= 2
                                ? "border-yellow-400 bg-yellow-50 text-yellow-800"
                                : s.value === 3
                                  ? "border-orange-400 bg-orange-50 text-orange-800"
                                  : "border-red-400 bg-red-50 text-red-800"
                              : "border-gray-200 bg-white text-muted-foreground hover:border-gray-300"
                          }`}
                        >
                          <span className="font-semibold">{s.value}</span>
                          <span className="hidden sm:inline">{tSeverity(String(s.value) as "1" | "2" | "3" | "4" | "5")}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">
                      {t("description")} <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={t("descriptionPlaceholder")}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={5}
                      className="mt-1.5 resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {t("descriptionCounter", { count: description.trim().length })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  {t("bookingDetails")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property_name">{t("propertyName")}</Label>
                    <Input
                      id="property_name"
                      type="text"
                      placeholder={t("propertyNamePlaceholder")}
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="platform">{t("platform")}</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger id="platform" className="mt-1.5">
                        <SelectValue placeholder={t("platformPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {tPlatform(p.value as "airbnb" | "booking" | "direct" | "other")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1"
                  size="lg"
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      {t("saving")}
                    </>
                  ) : (
                    t("saveChanges")
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
            <DialogDescription>
              {t("deleteConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  {t("deleting")}
                </>
              ) : (
                tCommon("delete")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
