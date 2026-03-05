"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "@/components/ui/toast";
import { AlertTriangle, Loader2 } from "lucide-react";

const INCIDENT_TYPES = [
  { value: "damage", label: "Property Damage" },
  { value: "theft", label: "Theft" },
  { value: "noise", label: "Noise Complaint" },
  { value: "fraud", label: "Fraud" },
  { value: "no_show", label: "No Show" },
  { value: "other", label: "Other" },
] as const;

const PLATFORMS = [
  { value: "Airbnb", label: "Airbnb" },
  { value: "Booking", label: "Booking.com" },
  { value: "Direct", label: "Direct Booking" },
  { value: "Other", label: "Other" },
] as const;

const SEVERITY_LABELS = [
  { value: 1, label: "Minor" },
  { value: 2, label: "Low" },
  { value: 3, label: "Medium" },
  { value: 4, label: "High" },
  { value: 5, label: "Critical" },
] as const;

export default function NewReportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [severity, setSeverity] = useState(3);
  const [description, setDescription] = useState("");
  const [propertyName, setPropertyName] = useState("");
  const [platform, setPlatform] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect to login if not authenticated
  if (!authLoading && !user) {
    router.push("/login?redirectTo=/report/new");
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!guestName.trim()) {
      setError("Guest name is required");
      return;
    }
    if (!incidentType) {
      setError("Please select an incident type");
      return;
    }
    if (description.trim().length < 10) {
      setError("Description must be at least 10 characters");
      return;
    }
    if (guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: guestName.trim(),
          guest_email: guestEmail.trim() || undefined,
          guest_phone: guestPhone.trim() || undefined,
          incident_type: incidentType,
          incident_date: incidentDate || undefined,
          severity,
          description: description.trim(),
          property_name: propertyName.trim() || undefined,
          platform: platform || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setError("You have already submitted a report for this guest");
        } else if (res.status === 401) {
          router.push("/login?redirectTo=/report/new");
        } else {
          setError(data.error || "Something went wrong");
        }
        return;
      }

      toast("success", "Report submitted successfully");
      router.push(`/guest/${data.guest_id}`);
    } catch {
      setError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Report a Guest</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Help the community by sharing your experience with a problematic
            guest.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle className="size-5 shrink-0 text-red-500 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <Card className="py-0 overflow-hidden">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Guest Information Section */}
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Guest Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="guest_name">
                      Guest Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="guest_name"
                      type="text"
                      placeholder="Full name of the guest"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      required
                      className="mt-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="guest_email">Guest Email</Label>
                      <Input
                        id="guest_email"
                        type="email"
                        placeholder="guest@example.com"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Helps match reports for the same guest
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="guest_phone">Guest Phone</Label>
                      <Input
                        id="guest_phone"
                        type="tel"
                        placeholder="+1 234 567 890"
                        value={guestPhone}
                        onChange={(e) => setGuestPhone(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Incident Details Section */}
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

              {/* Property & Platform Section */}
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

              {/* Submit */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full"
                  size="lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Report"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
