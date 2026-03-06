import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function Home() {
  const t = useTranslations("landing");
  const tAuth = useTranslations("auth");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Host Blacklist</h1>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="outline" size="sm">
                {t("signIn")}
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">{t("getStarted")}</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl font-bold mb-4">{t("hero")}</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
        <Link href="/register">
          <Button size="lg" className="text-lg px-8 py-6">
            {t("cta")}
          </Button>
        </Link>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-2">{t("feature1Title")}</h3>
            <p className="text-gray-600 text-sm">{t("feature1Desc")}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-2">{t("feature2Title")}</h3>
            <p className="text-gray-600 text-sm">{t("feature2Desc")}</p>
          </div>
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold mb-2">{t("feature3Title")}</h3>
            <p className="text-gray-600 text-sm">{t("feature3Desc")}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
