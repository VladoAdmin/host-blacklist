"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

  const reportId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<ReportData | null>(null);
  const [guest, setGuest] = useState<GuestInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
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
      router.push(`/login?redirectTo=/report/${reportId}/edit`);
      return;
    }

    async function fetchReport() {
      try {
        const res = await fetch(`/api/reports/${reportId}`);

        if (res.status === 401) {
          router.push(`/login?redirectTo=/report/${reportId}/edit`);
          return;
        }
        if (res.status === 403) {
          setError("You don't have permission to edit this report");
          setLoading(false);
          return;
        }
        if (res.status === 404) {
          setError("Report not found");
          setLoading(false);
          return;
        }
        if (!res.ok) {
          setError("Failed to load report");
          setLoading(false);
          return;
        }

        const data = await res.json();
        const r = data.report as ReportData;
        setReport(r);
        setGuest(data.guest);

        // Populate form
        setIncidentType(r.incident_type);
        setIncidentDate(r.incident_date || "");
        setSeverity(r.severity);
        setDescription(r.description);
        setPropertyName(r.property_name || "");
        setPlatform(r.platform || "");
      } catch {
        setError("Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchReport();
  }, [reportId, user, authLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!incidentType) {
      setFormError("Please select an incident type");
      return;
    }
    if (description.trim().length < 10) {
      setFormError("Description must be at least 10 characters");
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
        setFormError("You don't have permission to edit this report");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setFormError(data.error || "Failed to update report");
        return;
      }

      toast("success", "Report updated successfully");
      router.push("/dashboard");
    } catch {
      setFormError("Failed to update report. Please try again.");
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
        toast("error", "You don't have permission to delete this report");
        setDeleteDialogOpen(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast("error", data.error || "Failed to delete report");
        return;
      }

      toast("success", "Report deleted successfully");
      router.push("/dashboard");
    } catch {
      toast("error", "Failed to delete report. Please try again.");
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
          <p className="text-sm text-muted-foreground">Loading report...</p>
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
              Back to Dashboard
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
            <h1 className="text-2xl font-bold">Edit Report</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update your report details below.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="size-4 mr-1.5" />
            Delete
          </Button>
        </div>

        {/* Guest info (read-only) */}
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
                  Incident Details
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="incident_type">
                        Incident Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={incidentType}
                        onValueChange={setIncidentType}
                      >
                        <SelectTrigger id="incident_type" className="mt-1.5">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {INCIDENT_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="incident_date">Incident Date</Label>
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

                  {/* Severity */}
                  <div>
                    <Label>Severity</Label>
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
                          <span className="hidden sm:inline">{s.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what happened in detail (minimum 10 characters)..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={5}
                      className="mt-1.5 resize-none"
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {description.trim().length}/10 min characters
                    </p>
                  </div>
                </div>
              </div>

              {/* Booking Details */}
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Booking Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="property_name">Property Name</Label>
                    <Input
                      id="property_name"
                      type="text"
                      placeholder="Where did this happen?"
                      value={propertyName}
                      onChange={(e) => setPropertyName(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="platform">Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger id="platform" className="mt-1.5">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
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
                  Cancel
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
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Report</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this report? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
