"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAuthContext } from "@/app/providers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/toast";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuthContext();
  const t = useTranslations("settings");

  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [propertiesCount, setPropertiesCount] = useState(1);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formLoaded, setFormLoaded] = useState(false);

  useEffect(() => {
    if (profile && !formLoaded) {
      setFullName(profile.full_name || "");
      setCompanyName(profile.company_name || "");
      setCity(profile.city || "");
      setCountry(profile.country || "");
      setPropertiesCount(profile.properties_count || 1);
      setFormLoaded(true);
    }
  }, [profile, formLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError(t("fullNameRequired"));
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          company_name: companyName.trim() || null,
          city: city.trim() || null,
          country: country.trim() || null,
          properties_count: propertiesCount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      await refreshProfile();
      toast("success", t("updateSuccess"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
      toast("error", message);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-sentinel-muted" />
      </div>
    );
  }

  return (
    <div className="bg-sentinel-surface">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-sentinel-muted hover:text-white mb-6"
        >
          <ArrowLeft className="size-4" />
          {t("backToDashboard")}
        </Link>

        <Card className="bg-sentinel-card border-sentinel-border">
          <CardHeader>
            <CardTitle className="text-xl text-white">{t("title")}</CardTitle>
            <CardDescription className="text-sentinel-muted">
              {t("subtitle")}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sentinel-text">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-sentinel-bg border-sentinel-border text-sentinel-muted"
                />
                <p className="text-xs text-sentinel-muted">
                  {t("emailReadOnly")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sentinel-text">
                  {t("fullName")} <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder={t("fullNamePlaceholder")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  className="bg-sentinel-bg border-sentinel-border text-white placeholder:text-sentinel-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name" className="text-sentinel-text">{t("companyName")}</Label>
                <Input
                  id="company_name"
                  type="text"
                  placeholder={t("companyNamePlaceholder")}
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  autoComplete="organization"
                  className="bg-sentinel-bg border-sentinel-border text-white placeholder:text-sentinel-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-sentinel-text">{t("city")}</Label>
                <Input
                  id="city"
                  type="text"
                  placeholder={t("cityPlaceholder")}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  autoComplete="address-level2"
                  className="bg-sentinel-bg border-sentinel-border text-white placeholder:text-sentinel-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-sentinel-text">{t("country")}</Label>
                <Input
                  id="country"
                  type="text"
                  placeholder={t("countryPlaceholder")}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  autoComplete="country-name"
                  className="bg-sentinel-bg border-sentinel-border text-white placeholder:text-sentinel-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="properties_count" className="text-sentinel-text">
                  {t("propertiesCount")}
                </Label>
                <Input
                  id="properties_count"
                  type="number"
                  min={1}
                  max={9999}
                  value={propertiesCount}
                  onChange={(e) =>
                    setPropertiesCount(
                      Math.max(1, parseInt(e.target.value) || 1)
                    )
                  }
                  className="bg-sentinel-bg border-sentinel-border text-white"
                />
                <p className="text-xs text-sentinel-muted">
                  {t("propertiesCountHelp")}
                </p>
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" disabled={saving} className="w-full bg-sentinel-accent text-black hover:bg-amber-400 font-semibold">
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {t("saving")}
                  </>
                ) : (
                  t("saveChanges")
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
