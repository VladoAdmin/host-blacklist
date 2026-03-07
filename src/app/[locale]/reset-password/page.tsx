"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
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
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("auth");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError(t("passwordMinError"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("passwordsNoMatch"));
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sentinel-bg px-4">
      <Card className="w-full max-w-md bg-sentinel-card border-sentinel-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            {t("setNewPassword")}
          </CardTitle>
          <CardDescription className="text-sentinel-muted">
            {t("passwordMinLength")}
          </CardDescription>
        </CardHeader>

        {success ? (
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="size-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="size-6 text-green-500" />
              </div>
              <p className="text-sm text-sentinel-text text-center">
                {t("passwordChanged")}
              </p>
              <p className="text-xs text-sentinel-muted text-center">
                {t("redirecting")}
              </p>
            </div>
            <div className="text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm text-sentinel-accent hover:underline"
              >
                <ArrowLeft className="size-3" />
                {t("backToLogin")}
              </Link>
            </div>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sentinel-text">
                  {t("newPassword")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                  className="bg-sentinel-bg border-sentinel-border text-white placeholder:text-sentinel-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sentinel-text">
                  {t("confirmNewPassword")}
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                  className="bg-sentinel-bg border-sentinel-border text-white placeholder:text-sentinel-muted"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-sentinel-accent text-black hover:bg-amber-400 font-semibold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    {t("setNewPassword")}
                  </>
                ) : (
                  t("setNewPassword")
                )}
              </Button>
              <Link
                href="/login"
                className="inline-flex items-center gap-1 text-sm text-sentinel-accent hover:underline"
              >
                <ArrowLeft className="size-3" />
                {t("backToLogin")}
              </Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
