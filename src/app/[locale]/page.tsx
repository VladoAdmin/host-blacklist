import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Shield, Search, Users, MessageSquareWarning, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  const t = useTranslations("landing");
  const tAuth = useTranslations("auth");

  return (
    <div className="min-h-screen bg-sentinel-bg relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-sentinel-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sentinel-accent/3 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 glass border-b border-sentinel-border/30 sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="flex items-center gap-2.5 text-xl font-bold text-white">
            <Shield className="size-7 text-sentinel-accent" />
            <span className="tracking-tight">Sentinel HostGuard</span>
          </h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-sentinel-muted hover:text-white hover:bg-sentinel-card/50 transition-all duration-200">
                {t("signIn")}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-sentinel-accent text-black hover:brightness-110 font-semibold px-5 py-2 transition-all duration-200">
                {t("getStarted")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-sentinel-accent/20 bg-sentinel-accent/5 text-sentinel-accent text-sm font-medium mb-8 transition-all duration-300 hover:border-sentinel-accent/40 hover:bg-sentinel-accent/10">
            <Shield className="size-4" />
            <span>Sentinel HostGuard</span>
          </div>

          {/* Gradient headline */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight tracking-tight">
            <span className="gradient-text">{t("hero")}</span>
          </h2>

          <p className="text-lg sm:text-xl text-sentinel-muted mb-10 max-w-2xl mx-auto leading-relaxed">
            {t("subtitle")}
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="text-base sm:text-lg px-8 py-6 bg-sentinel-accent text-black hover:brightness-110 font-semibold shadow-lg shadow-sentinel-accent/20 transition-all duration-300 hover:shadow-xl hover:shadow-sentinel-accent/30 w-full sm:w-auto">
                {t("cta")}
                <ArrowRight className="size-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-base px-8 py-6 border-sentinel-border text-sentinel-text hover:bg-sentinel-card hover:text-white hover:border-sentinel-accent/30 transition-all duration-300 w-full sm:w-auto">
                {t("signIn")}
              </Button>
            </Link>
          </div>
        </section>

        {/* Feature Cards */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-sentinel-card/60 p-7 rounded-2xl border border-sentinel-border card-hover group">
              <div className="flex size-12 items-center justify-center rounded-xl bg-sentinel-accent/10 text-sentinel-accent mb-5 group-hover:bg-sentinel-accent/20 transition-colors duration-300">
                <Search className="size-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2.5 text-white tracking-tight">{t("feature1Title")}</h3>
              <p className="text-sentinel-muted text-sm leading-relaxed">{t("feature1Desc")}</p>
            </div>

            <div className="bg-sentinel-card/60 p-7 rounded-2xl border border-sentinel-border card-hover group">
              <div className="flex size-12 items-center justify-center rounded-xl bg-sentinel-accent/10 text-sentinel-accent mb-5 group-hover:bg-sentinel-accent/20 transition-colors duration-300">
                <MessageSquareWarning className="size-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2.5 text-white tracking-tight">{t("feature2Title")}</h3>
              <p className="text-sentinel-muted text-sm leading-relaxed">{t("feature2Desc")}</p>
            </div>

            <div className="bg-sentinel-card/60 p-7 rounded-2xl border border-sentinel-border card-hover group">
              <div className="flex size-12 items-center justify-center rounded-xl bg-sentinel-accent/10 text-sentinel-accent mb-5 group-hover:bg-sentinel-accent/20 transition-colors duration-300">
                <Users className="size-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2.5 text-white tracking-tight">{t("feature3Title")}</h3>
              <p className="text-sentinel-muted text-sm leading-relaxed">{t("feature3Desc")}</p>
            </div>
          </div>
        </section>

        {/* Social proof / Trust section */}
        <section className="border-t border-sentinel-border/50 bg-sentinel-surface/50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
            <p className="text-sm uppercase tracking-widest text-sentinel-muted mb-8 font-medium">
              Trusted by hosts worldwide
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold gradient-text-accent">100%</span>
                <span className="text-sm text-sentinel-muted mt-1">Free to use</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold gradient-text-accent">Real-time</span>
                <span className="text-sm text-sentinel-muted mt-1">Instant verification</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-3xl font-bold gradient-text-accent">Secure</span>
                <span className="text-sm text-sentinel-muted mt-1">Verified reports only</span>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight">
            Ready to protect your property?
          </h3>
          <p className="text-sentinel-muted mb-8 max-w-lg mx-auto">
            Join the community of hosts who verify guests before confirming reservations.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <div className="flex items-center gap-2 text-sm text-sentinel-muted">
              <CheckCircle2 className="size-4 text-sentinel-accent" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-sentinel-muted">
              <CheckCircle2 className="size-4 text-sentinel-accent" />
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-sentinel-muted">
              <CheckCircle2 className="size-4 text-sentinel-accent" />
              <span>Set up in 2 minutes</span>
            </div>
          </div>
          <Link href="/register">
            <Button size="lg" className="text-base px-8 py-6 bg-sentinel-accent text-black hover:brightness-110 font-semibold shadow-lg shadow-sentinel-accent/20 transition-all duration-300">
              {t("getStarted")}
              <ArrowRight className="size-5 ml-2" />
            </Button>
          </Link>
        </section>
      </main>
    </div>
  );
}
