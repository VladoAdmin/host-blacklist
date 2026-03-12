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
import { Shield, CheckCircle2 } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-sentinel-bg px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-green-500/3 rounded-full blur-3xl pointer-events-none" />
        <div className="w-full max-w-md relative z-10">
          <div className="flex items-center justify-center gap-2.5 mb-8">
            <Shield className="size-8 text-sentinel-accent" />
            <span className="text-xl font-bold text-white tracking-tight">Sentinel HostGuard</span>
          </div>
          <Card className="w-full bg-sentinel-card/80 border-sentinel-border/50 rounded-2xl shadow-2xl shadow-black/30">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                <CheckCircle2 className="size-12 text-green-400" />
              </div>
              <CardTitle className="text-2xl font-bold text-green-400 tracking-tight">
                {t("accountCreated")}
              </CardTitle>
              <CardDescription className="text-sentinel-muted">
                {t("checkEmail")}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-6">
              <p className="text-sm text-sentinel-muted mb-5 leading-relaxed">
                {t("confirmEmailDesc")}
              </p>
              <Link
                href="/login"
                className="text-sentinel-accent hover:text-amber-400 hover:underline font-medium text-sm transition-colors duration-200"
              >
                {t("backToLogin")}
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-sentinel-bg px-4 py-8 relative overflow-hidden">
      {/* Background subtle gradient */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-sentinel-accent/3 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-sentinel-accent/2 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <Shield className="size-8 text-sentinel-accent" />
          <span className="text-xl font-bold text-white tracking-tight">Sentinel HostGuard</span>
        </div>

        <Card className="w-full bg-sentinel-card/80 border-sentinel-border/50 rounded-2xl shadow-2xl shadow-black/30">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-white tracking-tight">{t("createAccount")}</CardTitle>
            <CardDescription className="text-sentinel-muted">
              {t("joinDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <OAuthButtons redirectTo="/dashboard" />
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-sentinel-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-sentinel-card px-3 text-sentinel-muted">
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
                <Label htmlFor="fullName" className="text-sentinel-text text-sm">{t("fullName")}</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder={t("fullNamePlaceholder")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  autoComplete="name"
                  className="bg-sentinel-surface border-sentinel-border text-white placeholder:text-sentinel-muted h-12 rounded-xl focus:ring-2 focus:ring-sentinel-accent/50 focus:border-sentinel-accent transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sentinel-text text-sm">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="bg-sentinel-surface border-sentinel-border text-white placeholder:text-sentinel-muted h-12 rounded-xl focus:ring-2 focus:ring-sentinel-accent/50 focus:border-sentinel-accent transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sentinel-text text-sm">{t("password")}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t("passwordMinLength")}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                  className="bg-sentinel-surface border-sentinel-border text-white placeholder:text-sentinel-muted h-12 rounded-xl focus:ring-2 focus:ring-sentinel-accent/50 focus:border-sentinel-accent transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sentinel-text text-sm">{t("confirmPassword")}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={t("confirmPasswordPlaceholder")}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  minLength={6}
                  className="bg-sentinel-surface border-sentinel-border text-white placeholder:text-sentinel-muted h-12 rounded-xl focus:ring-2 focus:ring-sentinel-accent/50 focus:border-sentinel-accent transition-all duration-200"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button type="submit" className="w-full bg-sentinel-accent text-black hover:brightness-110 font-semibold h-12 rounded-xl transition-all duration-200 text-base" disabled={loading}>
                {loading ? t("creatingAccount") : t("createAccount")}
              </Button>
              <p className="text-sm text-sentinel-muted text-center">
                {t("hasAccount")}{" "}
                <Link
                  href="/login"
                  className="text-sentinel-accent hover:text-amber-400 hover:underline font-medium transition-colors duration-200"
                >
                  {t("signIn")}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
