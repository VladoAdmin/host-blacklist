"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
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
import OAuthButtons from "@/components/auth/OAuthButtons";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuthContext();
  const router = useRouter();
  const t = useTranslations("auth");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("passwordsNoMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordMinError"));
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
    // Do NOT auto-redirect — wait for email confirmation
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sentinel-bg px-4">
        <Card className="w-full max-w-md bg-sentinel-card border-sentinel-border">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-green-400">
              {t("accountCreated")}
            </CardTitle>
            <CardDescription className="text-sentinel-muted">
              {t("checkEmail")}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-sentinel-muted mb-4">
              {t("confirmEmailDesc")}
            </p>
            <Link
              href="/login"
              className="text-sentinel-accent hover:underline font-medium text-sm"
            >
              {t("backToLogin")}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sentinel-bg px-4">
      <Card className="w-full max-w-md bg-sentinel-card border-sentinel-border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">{t("createAccount")}</CardTitle>
          <CardDescription className="text-sentinel-muted">
            {t("joinDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OAuthButtons redirectTo="/dashboard" />
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-sentinel-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-sentinel-card px-2 text-sentinel-muted">
                {t("orContinueWithEmail")}
              </span>
            </div>
          </div>
        </CardContent>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-sentinel-text">{t("fullName")}</Label>
              <Input
                id="fullName"
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
              <Label htmlFor="email" className="text-sentinel-text">{t("email")}</Label>
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
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sentinel-text">{t("password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t("passwordMinLength")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
                className="bg-sentinel-bg border-sentinel-border text-white placeholder:text-sentinel-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sentinel-text">{t("confirmPassword")}</Label>
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
            <Button type="submit" className="w-full bg-sentinel-accent text-black hover:bg-amber-400 font-semibold" disabled={loading}>
              {loading ? t("creatingAccount") : t("createAccount")}
            </Button>
            <p className="text-sm text-sentinel-muted text-center">
              {t("hasAccount")}{" "}
              <Link
                href="/login"
                className="text-sentinel-accent hover:underline font-medium"
              >
                {t("signIn")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
