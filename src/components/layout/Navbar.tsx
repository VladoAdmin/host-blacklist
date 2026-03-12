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
  MessageSquare,
  Lightbulb,
  FilePlus,
  Settings,
  HelpCircle,
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
  { href: "/chat" as const, labelKey: "chat" as const, icon: MessageSquare },
  { href: "/suggestions" as const, labelKey: "suggestions" as const, icon: Lightbulb },
  { href: "/report/new" as const, labelKey: "addReport" as const, icon: FilePlus },
  { href: "/settings" as const, labelKey: "settings" as const, icon: Settings },
  { href: "/help" as const, labelKey: "help" as const, icon: HelpCircle },
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
      <header className="glass border-b border-sentinel-border/30 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16" />
      </header>
    );
  }

  // Not logged in on a protected route: show only logo
  if (!user) {
    return (
      <header className="glass border-b border-sentinel-border/30 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 text-xl font-bold text-white">
            <Shield className="size-6 text-sentinel-accent" />
            <span className="tracking-tight">Sentinel HostGuard</span>
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

  const displayName = profile?.nickname || profile?.full_name || user.email || "User";
  const strippedPath = stripLocale(pathname);

  return (
    <header className="glass border-b border-sentinel-border/30 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 text-xl font-bold text-white shrink-0">
          <Shield className="size-6 text-sentinel-accent" />
          <span className="tracking-tight hidden sm:inline">Sentinel HostGuard</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 ml-8">
          {NAV_LINKS.map(({ href, labelKey, icon: Icon }) => {
            const isActive =
              strippedPath === href || strippedPath.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-white bg-sentinel-card/80"
                    : "text-sentinel-muted hover:text-white hover:bg-sentinel-card/40"
                )}
              >
                <Icon className="size-4" />
                {t(labelKey)}
                {isActive && (
                  <span className="absolute -bottom-[13px] left-3 right-3 h-0.5 bg-sentinel-accent rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop user area */}
        <div className="hidden md:flex items-center gap-3 ml-auto">
          <LanguageSwitcher />
          <div className="h-5 w-px bg-sentinel-border/50" />
          <span className="text-sm text-sentinel-muted truncate max-w-[160px]">
            {displayName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-sentinel-muted hover:text-white hover:bg-sentinel-card/50 transition-all duration-200"
          >
            <LogOut className="size-4 mr-1.5" />
            {tAuth("signOut")}
          </Button>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-sentinel-card/50 h-10 w-10"
              aria-label={t("navigationMenu")}
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 p-0 bg-sentinel-bg/95 backdrop-blur-xl border-sentinel-border/30">
            <SheetTitle className="sr-only">{t("navigationMenu")}</SheetTitle>
            <div className="flex flex-col h-full">
              {/* Mobile header */}
              <div className="px-5 py-5 border-b border-sentinel-border/30">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-full bg-sentinel-accent/10">
                    <span className="text-sm font-bold text-sentinel-accent">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate text-white text-sm">{displayName}</p>
                    <p className="text-xs text-sentinel-muted truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* Mobile nav links */}
              <nav className="flex-1 py-3 px-2">
                {NAV_LINKS.map(({ href, labelKey, icon: Icon }) => {
                  const isActive =
                    strippedPath === href || strippedPath.startsWith(href + "/");
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 my-0.5",
                        isActive
                          ? "bg-sentinel-card text-white"
                          : "text-sentinel-muted hover:bg-sentinel-card/50 hover:text-white active:bg-sentinel-card"
                      )}
                    >
                      <Icon className="size-5" />
                      {t(labelKey)}
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-sentinel-accent" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Language switcher + sign out */}
              <div className="border-t border-sentinel-border/30 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-sentinel-muted">Jazyk</span>
                  <LanguageSwitcher />
                </div>
                <Button
                  variant="outline"
                  className="w-full border-sentinel-border/50 text-sentinel-text hover:bg-sentinel-card hover:border-sentinel-accent/30 transition-all duration-200 h-11"
                  onClick={() => {
                    setMobileOpen(false);
                    handleSignOut();
                  }}
                >
                  <LogOut className="size-4 mr-2" />
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
