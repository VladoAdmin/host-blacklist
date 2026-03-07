"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
import { Loader2, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("auth");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSent(true);
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
            {t("resetPassword")}
          </CardTitle>
          <CardDescription className="text-sentinel-muted">
            {t("resetPasswordDesc")}
          </CardDescription>
        </CardHeader>

        {sent ? (
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="size-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Mail className="size-6 text-green-500" />
              </div>
              <p className="text-sm text-sentinel-text text-center">
                {t("resetEmailSent")}
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
                <Label htmlFor="email" className="text-sentinel-text">
                  {t("email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
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
                    {t("resetPassword")}
                  </>
                ) : (
                  t("resetPassword")
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
