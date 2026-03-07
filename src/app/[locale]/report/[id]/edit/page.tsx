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
import PhotoUpload from "@/components/report/PhotoUpload";

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
  photo_urls: string[] | null;
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
  const tUpload = useTranslations("upload");

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
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

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
        setPhotoUrls(r.photo_urls || []);
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
          photo_urls: photoUrls,
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
      <div className="min-h-screen flex items-center justify-center bg-sentinel-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-sentinel-muted border-t-transparent" />
          <p className="text-sm text-sentinel-muted">{t("loadingReport")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-sentinel-surface">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-16 text-sentinel-muted">
            <AlertTriangle className="size-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-sentinel-border text-sentinel-text hover:bg-sentinel-card"
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
    <div className="min-h-screen bg-sentinel-surface">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{t("editTitle")}</h1>
            <p className="text-sm text-sentinel-muted mt-1">
              {t("editSubtitle")}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="size-4 mr-1.5" />
            {tCommon("delete")}
          </Button>
        </div>

        {guest && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-sentinel-border bg-sentinel-card px-4 py-3">
            <User className="size-4 text-sentinel-muted shrink-0" />
            <div className="text-sm">
              <span className="font-medium text-white">{guest.full_name}</span>
              {guest.email && (
                <span className="text-sentinel-muted ml-2">
                  ({guest.email})
                </span>
              )}
            </div>
          </div>
        )}

        {formError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
            <AlertTriangle className="size-5 shrink-0 text-red-400 mt-0.5" />
            <p className="text-sm text-red-400">{formError}</p>
          </div>
        )}

        <Card className="py-0 overflow-hidden bg-sentinel-card border-sentinel-border">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Incident Details */}
              <div>
                <h2 className="text-sm font-semibold text-sentinel-muted uppercase tracking-wider mb-4">
                  {t("incidentDetails")}
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="incident_type" className="text-sentinel-text">
                        {t("incidentType")} <span className="text-red-400">*</span>
                      </Label>
                      <Select
                        value={incidentType}
                        onValueChange={setIncidentType}
                      >
                        <SelectTrigger id="incident_type" className="mt-1.5 bg-sentinel-bg border-sentinel-border text-white">
                          <SelectValue placeholder={t("incidentTypePlaceholder")} />
                        </SelectTrigger>
                        <SelectContent className="bg-sentinel-card border-sentinel-border">
                          {INCIDENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value} className="text-sentinel-text hover:bg-sentinel-border">
                              {tIncident(type.value as "damage" | "theft" | "noise" | "fraud" | "no_show" | "other")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="incident_date" className="text-sentinel-text">{t("incidentDate")}</Label>
                      <Input
                        id="incident_date"
                        type="date"
                        value={incidentDate}
                        onChange={(e) => setIncidentDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        className="mt-1.5 bg-sentinel-bg border-sentinel-border text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sentinel-text">{t("severity")}</Label>
                    <div className="flex items-center gap-2 mt-2">
                      {SEVERITY_LABELS.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setSeverity(s.value)}
                          className={`flex flex-col items-center gap-1 rounded-lg border px-3 py-2 text-xs transition-colors ${
                            severity === s.value
                              ? s.value <= 2
                                ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                                : s.value === 3
                                  ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                                  : "border-red-500/50 bg-red-500/10 text-red-400"
                              : "border-sentinel-border bg-sentinel-bg text-sentinel-muted hover:border-sentinel-muted/50"
                          }`}
                        >
                          <span className="font-semibold">{s.value}</span>
                          <span className="hidden sm:inline">{tSeverity(String(s.value) as "1" | "2" | "3" | "4" | "5")}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sentinel-text">
                      {t("description")} <span className="text-red-400">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder={t("descriptionPlaceholder")}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={5}
                      className="mt-1.5 resize-none bg-sentinel-bg border-sentinel-border text-white placeholder:text-sentinel-muted"
                    />
                    <p className="text-xs text-sentinel-muted mt-1 text-right">
                      {t("descriptionCounter", { count: description.trim().length })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Photos Section */}
              <div>
                <h2 className="text-sm font-semibold text-sentinel-muted uppercase tracking-wider mb-4">
                  {tUpload("title")}
                </h2>
                <PhotoUpload
                  photos={photoUrls}
                  onPhotosChange={setPhotoUrls}
                  maxPhotos={3}
                />
              </div>

              {/* Booking Details */}
              <div>
                <h2 className="text-sm font-semibold text-sentinel-muted uppercase tracking-wider mb-4">
                  {t("bookingDetails")}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property_name" className="text-sentinel-text">{t("propertyName")}</Label>
                    <Input
                      id="property_name"
                      type="text"
                      placeholder={t("propertyNamePlaceholder")}
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      className="mt-1.5 bg-sentinel-bg border-sentinel-border text-white placeholder:text-sentinel-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="platform" className="text-sentinel-text">{t("platform")}</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger id="platform" className="mt-1.5 bg-sentinel-bg border-sentinel-border text-white">
                        <SelectValue placeholder={t("platformPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent className="bg-sentinel-card border-sentinel-border">
                        {PLATFORMS.map((p) => (
                          <SelectItem key={p.value} value={p.value} className="text-sentinel-text hover:bg-sentinel-border">
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
                  className="flex-1 border-sentinel-border text-sentinel-text hover:bg-sentinel-card"
                  size="lg"
                >
                  {tCommon("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-sentinel-accent text-black hover:bg-amber-400 font-semibold"
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
        <DialogContent className="sm:max-w-md bg-sentinel-card border-sentinel-border">
          <DialogHeader>
            <DialogTitle className="text-white">{t("deleteTitle")}</DialogTitle>
            <DialogDescription className="text-sentinel-muted">
              {t("deleteConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-sentinel-border text-sentinel-text hover:bg-sentinel-card"
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
