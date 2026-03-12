"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card } from "@/components/ui/card";
import {
  Search,
  Camera,
  BarChart3,
  MessageSquare,
  Lightbulb,
  Globe,
  Smartphone,
  ChevronRight,
  Shield,
  AlertTriangle,
  Mail,
  HelpCircle,
} from "lucide-react";

const FEATURES = [
  { icon: Search, key: "featureSearch" },
  { icon: Camera, key: "featureOcr" },
  { icon: BarChart3, key: "featureStats" },
  { icon: MessageSquare, key: "featureChat" },
  { icon: Lightbulb, key: "featureSuggestions" },
  { icon: Globe, key: "featureI18n" },
  { icon: Smartphone, key: "featurePwa" },
] as const;

const INCIDENT_TYPES = [
  { emoji: "🏚️", key: "damage" },
  { emoji: "🔓", key: "theft" },
  { emoji: "🔊", key: "noise" },
  { emoji: "💳", key: "fraud" },
  { emoji: "❌", key: "no_show" },
  { emoji: "📋", key: "other" },
] as const;

const SEVERITY_LEVELS = [
  { level: 1, color: "bg-green-500" },
  { level: 2, color: "bg-yellow-500" },
  { level: 3, color: "bg-orange-500" },
  { level: 4, color: "bg-red-500" },
  { level: 5, color: "bg-red-700" },
] as const;

const FAQ_ITEMS = [
  { q: "faqLegal", a: "faqLegalAnswer" },
  { q: "faqDispute", a: "faqDisputeAnswer" },
  { q: "faqVisibility", a: "faqVisibilityAnswer" },
  { q: "faqReport", a: "faqReportAnswer" },
  { q: "faqPwa", a: "faqPwaAnswer" },
] as const;

export default function HelpPage() {
  const t = useTranslations("help");
  const tIncident = useTranslations("incidentTypes");

  return (
    <div className="bg-sentinel-surface min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-sentinel-accent/10 mb-4">
            <HelpCircle className="size-8 text-sentinel-accent" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-3">
            {t("title")}
          </h1>
          <p className="text-sentinel-muted text-lg max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>

        {/* What is Sentinel HostGuard? */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="size-6 text-sentinel-accent shrink-0" />
            <h2 className="text-xl font-bold text-white">{t("whatIs")}</h2>
          </div>
          <Card className="bg-sentinel-card border-sentinel-border p-5 sm:p-6">
            <p className="text-sentinel-text leading-relaxed">
              {t("whatIsDesc")}
            </p>
          </Card>
        </section>

        {/* How it works */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <ChevronRight className="size-6 text-sentinel-accent shrink-0" />
            <h2 className="text-xl font-bold text-white">{t("howItWorks")}</h2>
          </div>
          <div className="grid gap-3">
            {([1, 2, 3, 4] as const).map((step) => (
              <Card
                key={step}
                className="bg-sentinel-card border-sentinel-border p-4 sm:p-5 flex items-start gap-4"
              >
                <div className="flex size-8 items-center justify-center rounded-full bg-sentinel-accent/10 shrink-0">
                  <span className="text-sm font-bold text-sentinel-accent">
                    {step}
                  </span>
                </div>
                <p className="text-sentinel-text text-sm sm:text-base">
                  {t(`step${step}`)}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">{t("features")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, key }) => (
              <Card
                key={key}
                className="bg-sentinel-card border-sentinel-border p-4 flex items-start gap-3"
              >
                <Icon className="size-5 text-sentinel-accent shrink-0 mt-0.5" />
                <p className="text-sentinel-text text-sm">{t(key)}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Incident Types */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="size-6 text-sentinel-accent shrink-0" />
            <h2 className="text-xl font-bold text-white">
              {t("incidentTypes")}
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {INCIDENT_TYPES.map(({ emoji, key }) => (
              <Card
                key={key}
                className="bg-sentinel-card border-sentinel-border p-4 text-center"
              >
                <span className="text-2xl mb-2 block">{emoji}</span>
                <span className="text-sentinel-text text-sm">
                  {tIncident(key)}
                </span>
              </Card>
            ))}
          </div>
        </section>

        {/* Severity */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">
            {t("severity")}
          </h2>
          <Card className="bg-sentinel-card border-sentinel-border p-5 sm:p-6">
            <div className="space-y-3">
              {SEVERITY_LEVELS.map(({ level, color }) => (
                <div key={level} className="flex items-center gap-3">
                  <div
                    className={`size-8 rounded-lg ${color} flex items-center justify-center shrink-0`}
                  >
                    <span className="text-sm font-bold text-white">
                      {level}
                    </span>
                  </div>
                  <span className="text-sentinel-text text-sm">
                    {t(`severity${level}` as const)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">{t("faq")}</h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map(({ q, a }) => (
              <Card
                key={q}
                className="bg-sentinel-card border-sentinel-border p-5"
              >
                <h3 className="font-semibold text-white mb-2">{t(q)}</h3>
                <p className="text-sentinel-muted text-sm leading-relaxed">
                  {t(a)}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Mail className="size-6 text-sentinel-accent shrink-0" />
            <h2 className="text-xl font-bold text-white">{t("contact")}</h2>
          </div>
          <Card className="bg-sentinel-card border-sentinel-border p-5 sm:p-6">
            <div className="space-y-3">
              <p className="text-sentinel-text text-sm">{t("contactEmail")}</p>
              <p className="text-sentinel-text text-sm">
                {t("contactSuggestions")}{" "}
                <Link
                  href="/suggestions"
                  className="text-sentinel-accent hover:underline font-medium"
                >
                  Suggestions
                </Link>
              </p>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
