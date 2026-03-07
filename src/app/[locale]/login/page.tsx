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
    <Card className="w-full max-w-md bg-sentinel-card border-sentinel-border">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-white">{t("signIn")}</CardTitle>
        <CardDescription className="text-sentinel-muted">{t("welcomeBack")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <OAuthButtons redirectTo={redirectTo} />
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
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              minLength={6}
              className="bg-sentinel-bg border-sentinel-border text-white placeholder:text-sentinel-muted"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full bg-sentinel-accent text-black hover:bg-amber-400 font-semibold" disabled={loading}>
            {loading ? t("signingIn") : t("signIn")}
          </Button>
          <Link
            href="/forgot-password"
            className="text-sm text-sentinel-accent hover:underline"
          >
            {t("forgotPassword")}
          </Link>
          <p className="text-sm text-sentinel-muted text-center">
            {t("noAccount")}{" "}
            <Link
              href="/register"
              className="text-sentinel-accent hover:underline font-medium"
            >
              {t("signUp")}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  const t = useTranslations("common");

  return (
    <div className="min-h-screen flex items-center justify-center bg-sentinel-bg px-4">
      <Suspense
        fallback={
          <div className="text-sentinel-muted">{t("loading")}</div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
