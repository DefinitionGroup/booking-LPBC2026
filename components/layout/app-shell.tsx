"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { transitions, variants } from "@/components/ui/motion";
import { useI18n } from "@/components/i18n-provider";
import {
  LayoutDashboard,
  CalendarDays,
  DoorOpen,
  Settings,
  Menu,
  X,
  CreditCard,
  Building2,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  userNav?: React.ReactNode;
}

const navigation = [
  { key: "common.dashboard", href: "/", icon: LayoutDashboard },
  { key: "common.schedule", href: "/schedule", icon: CalendarDays },
  { key: "common.bookings", href: "/bookings", icon: CreditCard },
  { key: "common.rooms", href: "/rooms", icon: DoorOpen },
  { key: "common.buildings", href: "/building", icon: Building2 },
  { key: "common.settings", href: "/settings", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children, userNav }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();
  const pageTitle =
    navigation.find((item) => isActivePath(pathname, item.href))?.key ?? "nav.workspace";
  const quickCtaHref = pathname.startsWith("/bookings/new") ? "/schedule" : "/bookings/new";
  const quickCtaLabel = pathname.startsWith("/bookings/new")
    ? t("nav.openLiveSchedule")
    : t("nav.fastCleanScheduling");

  return (
    <div className="relative min-h-screen text-foreground">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            type="button"
            aria-label={t("common.cancel")}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[1px] lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transitions.fast}
          />
        )}
      </AnimatePresence>

      <div className="relative flex min-h-screen gap-3 p-3 sm:gap-4 sm:p-4">
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={transitions.smooth}
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 m-3 rounded-2xl border border-white/50 bg-card/75 backdrop-blur-xl shadow-[0_20px_60px_-30px_rgba(8,23,41,0.45)] transition-transform lg:sticky lg:top-4 lg:m-0 lg:h-[calc(100vh-2rem)] lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
          )}
        >
          <div className="flex h-16 items-center border-b border-border/70 px-5">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">{t("common.appName")}</div>
                <div className="text-[11px] text-muted-foreground">{t("nav.roomIntelligence")}</div>
              </div>
            </div>
            <button
              type="button"
              className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
              aria-label={t("common.cancel")}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <motion.nav
            className="flex-1 overflow-y-auto px-3 py-4"
            variants={variants.stagger}
            initial="hidden"
            animate="show"
          >
            <ul className="space-y-1.5">
              {navigation.map((item) => {
                const isActive = isActivePath(pathname, item.href);
                return (
                  <motion.li key={item.key} variants={variants.fadeInUp}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="app-nav-active"
                          className="absolute inset-0 rounded-xl border border-border/80 bg-gradient-to-r from-white/70 to-white/40 dark:from-white/10 dark:to-white/5"
                          transition={transitions.spring}
                        />
                      )}
                      <item.icon className="relative z-10 h-4 w-4" />
                      <span className="relative z-10">{t(item.key)}</span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </motion.nav>

          <div className="border-t border-border/70 p-4">
            <Link
              href={quickCtaHref}
              className="group flex items-center gap-2 rounded-xl border border-border/70 bg-background/65 px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-300" />
              <span>{quickCtaLabel}</span>
              <ArrowUpRight className="ml-auto h-3.5 w-3.5 opacity-60 transition-opacity group-hover:opacity-100" />
            </Link>
          </div>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4 lg:ml-0">
          <motion.header
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={transitions.smooth}
            className="sticky top-3 z-30 flex h-16 items-center gap-3 rounded-2xl border border-white/50 bg-card/70 px-4 backdrop-blur-xl shadow-[0_8px_35px_-22px_rgba(8,23,41,0.45)] sm:px-5"
          >
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-xl border border-border/70 bg-background/80 text-muted-foreground hover:text-foreground lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">{t("common.schedule")}</span>
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("nav.workspace")}</p>
              <p className="truncate text-sm font-semibold">{t(pageTitle)}</p>
            </div>

            <div className="ml-auto">{userNav}</div>
          </motion.header>

          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.smooth}
            className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-white/45 bg-card/58 p-4 backdrop-blur-xl shadow-[0_22px_70px_-35px_rgba(8,23,41,0.5)] sm:p-6 lg:p-8"
          >
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
