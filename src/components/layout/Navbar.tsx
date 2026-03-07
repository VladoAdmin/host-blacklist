"use client";

import { usePathname as useNextPathname } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useAuthContext } from "@/app/providers";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Search,
  LayoutDashboard,
  FilePlus,
  Settings,
  LogOut,
  Menu,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { routing } from "@/i18n/routing";

const NAV_LINKS = [
  { href: "/search" as const, labelKey: "search" as const, icon: Search },
  { href: "/dashboard" as const, labelKey: "dashboard" as const, icon: LayoutDashboard },
  { href: "/report/new" as const, labelKey: "addReport" as const, icon: FilePlus },
  { href: "/settings" as const, labelKey: "settings" as const, icon: Settings },
];

/** Routes where the navbar should NOT be shown (public pages). */
const PUBLIC_ROUTES = ["/", "/login", "/register"];

function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.slice(`/${locale}`.length) || "/";
    }
  }
  return pathname;
}

function isPublicRoute(pathname: string) {
  const strippedPath = stripLocale(pathname);
  return PUBLIC_ROUTES.includes(strippedPath);
}

export function Navbar() {
  const pathname = useNextPathname();
  const router = useRouter();
  const { user, profile, signOut, loading } = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");

  // Don't render navbar on public routes
  if (isPublicRoute(pathname)) {
    return null;
  }

  // While auth is loading, render a minimal placeholder to avoid layout shift
  if (loading) {
    return (
      <header className="bg-sentinel-bg border-b border-sentinel-border">
        <div className="max-w-6xl mx-auto px-4 h-14" />
      </header>
    );
  }

  // Not logged in on a protected route: show only logo
  if (!user) {
    return (
      <header className="bg-sentinel-bg border-b border-sentinel-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-white">
            <Shield className="size-5 text-sentinel-accent" />
            Sentinel HostGuard
          </Link>
          <LanguageSwitcher />
        </div>
      </header>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const displayName = profile?.full_name || user.email || "User";
  const strippedPath = stripLocale(pathname);

  return (
    <header className="bg-sentinel-bg border-b border-sentinel-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-white shrink-0">
          <Shield className="size-5 text-sentinel-accent" />
          Sentinel HostGuard
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 ml-8">
          {NAV_LINKS.map(({ href, labelKey, icon: Icon }) => {
            const isActive =
              strippedPath === href || strippedPath.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sentinel-card text-white"
                    : "text-sentinel-muted hover:bg-sentinel-card/50 hover:text-white"
                )}
              >
                <Icon className="size-4" />
                {t(labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* Desktop user area */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <LanguageSwitcher />
          <span className="text-sm text-sentinel-muted truncate max-w-[160px]">
            {displayName}
          </span>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="border-sentinel-border text-sentinel-text hover:bg-sentinel-card">
            <LogOut className="size-4" />
            {tAuth("signOut")}
          </Button>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-sentinel-card"
              aria-label={t("navigationMenu")}
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0 bg-sentinel-bg border-sentinel-border">
            <SheetTitle className="sr-only">{t("navigationMenu")}</SheetTitle>
            <div className="flex flex-col h-full">
              {/* Mobile header */}
              <div className="px-4 py-4 border-b border-sentinel-border">
                <p className="font-semibold truncate text-white">{displayName}</p>
                <p className="text-xs text-sentinel-muted truncate">{user.email}</p>
              </div>

              {/* Mobile nav links */}
              <nav className="flex-1 py-2">
                {NAV_LINKS.map(({ href, labelKey, icon: Icon }) => {
                  const isActive =
                    strippedPath === href || strippedPath.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-sentinel-card text-white"
                          : "text-sentinel-muted hover:bg-sentinel-card/50 hover:text-white"
                      )}
                    >
                      <Icon className="size-5" />
                      {t(labelKey)}
                    </Link>
                  );
                })}
              </nav>

              {/* Language switcher + sign out */}
              <div className="border-t border-sentinel-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-sentinel-muted">Jazyk</span>
                  <LanguageSwitcher />
                </div>
                <Button
                  variant="outline"
                  className="w-full border-sentinel-border text-sentinel-text hover:bg-sentinel-card"
                  onClick={() => {
                    setMobileOpen(false);
                    handleSignOut();
                  }}
                >
                  <LogOut className="size-4" />
                  {tAuth("signOut")}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
