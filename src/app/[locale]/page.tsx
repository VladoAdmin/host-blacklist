import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Shield, Search, Users, MessageSquareWarning } from "lucide-react";

export default function Home() {
  const t = useTranslations("landing");
  const tAuth = useTranslations("auth");

  return (
    <div className="min-h-screen bg-gradient-to-b from-sentinel-bg via-sentinel-navy to-sentinel-bg">
      <header className="border-b border-sentinel-border/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="flex items-center gap-2 text-xl font-bold text-white">
            <Shield className="size-6 text-sentinel-accent" />
            Sentinel HostGuard
          </h1>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="outline" size="sm" className="border-sentinel-border text-sentinel-text hover:bg-sentinel-card hover:text-white">
                {t("signIn")}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-sentinel-accent text-black hover:bg-amber-400 font-semibold">
                {t("getStarted")}
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-sentinel-accent/30 bg-sentinel-accent/10 text-sentinel-accent text-sm font-medium mb-8">
          <Shield className="size-4" />
          Sentinel HostGuard
        </div>
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white leading-tight">
          {t("hero")}
        </h2>
        <p className="text-xl text-sentinel-muted mb-10 max-w-2xl mx-auto leading-relaxed">
          {t("subtitle")}
        </p>
        <Link href="/register">
          <Button size="lg" className="text-lg px-8 py-6 bg-sentinel-accent text-black hover:bg-amber-400 font-semibold shadow-lg shadow-sentinel-accent/20">
            {t("cta")}
          </Button>
        </Link>
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-sentinel-card/80 p-6 rounded-xl border border-sentinel-border hover:border-sentinel-accent/30 transition-colors group">
            <div className="flex size-10 items-center justify-center rounded-lg bg-sentinel-accent/10 text-sentinel-accent mb-4 group-hover:bg-sentinel-accent/20 transition-colors">
              <Search className="size-5" />
            </div>
            <h3 className="font-semibold mb-2 text-white">{t("feature1Title")}</h3>
            <p className="text-sentinel-muted text-sm leading-relaxed">{t("feature1Desc")}</p>
          </div>
          <div className="bg-sentinel-card/80 p-6 rounded-xl border border-sentinel-border hover:border-sentinel-accent/30 transition-colors group">
            <div className="flex size-10 items-center justify-center rounded-lg bg-sentinel-accent/10 text-sentinel-accent mb-4 group-hover:bg-sentinel-accent/20 transition-colors">
              <MessageSquareWarning className="size-5" />
            </div>
            <h3 className="font-semibold mb-2 text-white">{t("feature2Title")}</h3>
            <p className="text-sentinel-muted text-sm leading-relaxed">{t("feature2Desc")}</p>
          </div>
          <div className="bg-sentinel-card/80 p-6 rounded-xl border border-sentinel-border hover:border-sentinel-accent/30 transition-colors group">
            <div className="flex size-10 items-center justify-center rounded-lg bg-sentinel-accent/10 text-sentinel-accent mb-4 group-hover:bg-sentinel-accent/20 transition-colors">
              <Users className="size-5" />
            </div>
            <h3 className="font-semibold mb-2 text-white">{t("feature3Title")}</h3>
            <p className="text-sentinel-muted text-sm leading-relaxed">{t("feature3Desc")}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
