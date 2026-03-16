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
} from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
  userNav?: React.ReactNode;
  appName?: string;
}

const navigation = [
  { key: "common.dashboard", href: "/", icon: LayoutDashboard },
  { key: "common.schedule", href: "/schedule", icon: CalendarDays },
  { key: "common.bookings", href: "/bookings", icon: CreditCard },
  { key: "common.rooms", href: "/rooms", icon: DoorOpen },
  { key: "common.settings", href: "/settings", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({ children, userNav, appName }: AppShellProps) {
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
            "fixed inset-y-0 left-0 z-50 flex w-72 flex-col m-3 rounded-lg bg-card/80 backdrop-blur-xl shadow-md transition-transform lg:sticky lg:top-4 lg:m-0 lg:h-[calc(100vh-2rem)] lg:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-[120%] lg:translate-x-0"
          )}
        >
          <div className="flex h-16 items-center border-b border-border/30 px-5">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs tracking-tight">{appName ?? t("common.appName")}</div>
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
                        "relative flex items-center gap-3 overflow-hidden rounded-md px-3 py-2.5 text-xs transition-colors",
                        isActive
                          ? "text-foreground"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="app-nav-active"
                          className="absolute inset-0 rounded-md bg-muted/60 dark:bg-muted/40"
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

          <div className="border-t border-border/30 p-4 space-y-3">
            <Link
              href={quickCtaHref}
              className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-full bg-emphasis text-emphasis-foreground px-3 text-xs font-medium transition-colors hover:bg-emphasis/85"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{quickCtaLabel}</span>
            </Link>
            {userNav}
          </div>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4 lg:ml-0">
          <motion.header
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={transitions.smooth}
            className="sticky top-3 z-30 flex h-16 items-center gap-3 rounded-lg bg-card/80 px-4 backdrop-blur-xl shadow-sm sm:px-5"
          >
            <button
              type="button"
              className="grid h-9 w-9 place-items-center rounded-md bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">{t("common.schedule")}</span>
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{t("nav.workspace")}</p>
              <p className="truncate text-xs">{t(pageTitle)}</p>
            </div>
          </motion.header>

          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={transitions.smooth}
            className="min-h-0 flex-1 overflow-y-auto rounded-lg bg-card/70 p-4 backdrop-blur-xl shadow-sm sm:p-6 lg:p-8"
          >
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </motion.main>
        </div>
      </div>
    </div>
  );
}
