"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { Shield } from "lucide-react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuthContext();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const t = useTranslations("auth");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push(redirectTo as "/dashboard");
    router.refresh();
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="flex items-center justify-center gap-2.5 mb-8">
        <Shield className="size-8 text-sentinel-accent" />
        <span className="text-xl font-bold text-white tracking-tight">Sentinel HostGuard</span>
      </div>

      <Card className="w-full bg-sentinel-card/80 border-sentinel-border/50 rounded-2xl shadow-2xl shadow-black/30">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-bold text-white tracking-tight">{t("signIn")}</CardTitle>
          <CardDescription className="text-sentinel-muted">{t("welcomeBack")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <OAuthButtons redirectTo={redirectTo} />
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
                placeholder={t("passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                minLength={6}
                className="bg-sentinel-surface border-sentinel-border text-white placeholder:text-sentinel-muted h-12 rounded-xl focus:ring-2 focus:ring-sentinel-accent/50 focus:border-sentinel-accent transition-all duration-200"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button type="submit" className="w-full bg-sentinel-accent text-black hover:brightness-110 font-semibold h-12 rounded-xl transition-all duration-200 text-base" disabled={loading}>
              {loading ? t("signingIn") : t("signIn")}
            </Button>
            <Link
              href="/forgot-password"
              className="text-sm text-sentinel-accent hover:text-amber-400 hover:underline transition-colors duration-200"
            >
              {t("forgotPassword")}
            </Link>
            <p className="text-sm text-sentinel-muted text-center">
              {t("noAccount")}{" "}
              <Link
                href="/register"
                className="text-sentinel-accent hover:text-amber-400 hover:underline font-medium transition-colors duration-200"
              >
                {t("signUp")}
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  const t = useTranslations("common");

  return (
    <div className="min-h-screen flex items-center justify-center bg-sentinel-bg px-4 relative overflow-hidden">
      {/* Background subtle gradient */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-sentinel-accent/3 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-sentinel-accent/2 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <Suspense
          fallback={
            <div className="text-sentinel-muted">{t("loading")}</div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
