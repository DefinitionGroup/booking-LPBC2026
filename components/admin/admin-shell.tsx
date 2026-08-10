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
  Building2,
  Layers,
  DoorOpen,
  CalendarPlus,
  CalendarDays,
  Users,
  Menu,
  X,
  ShieldCheck,
  Settings,
} from "lucide-react";

interface AdminShellProps {
  children: React.ReactNode;
  userNav?: React.ReactNode;
}

const navItems = [
  { href: "/admin", labelKey: "common.dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", labelKey: "common.bookings", icon: CalendarDays },
  { href: "/admin/bookings/new", labelKey: "common.newBooking", icon: CalendarPlus },
  { href: "/admin/users", labelKey: "common.users", icon: Users },
  { href: "/admin/buildings", labelKey: "common.buildings", icon: Building2 },
  { href: "/admin/floors", labelKey: "common.floors", icon: Layers },
  { href: "/admin/rooms", labelKey: "common.rooms", icon: DoorOpen },
  { href: "/admin/settings", labelKey: "common.settings", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  if (href === "/admin/bookings") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children, userNav }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useI18n();
  const pageTitle =
    navItems.find((item) => isActivePath(pathname, item.href))?.labelKey ?? "common.admin";

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
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs tracking-tight">{t("nav.adminConsole")}</div>
                <div className="text-[11px] text-muted-foreground">{t("nav.operationsApprovals")}</div>
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
              {navItems.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <motion.li key={item.href} variants={variants.fadeInUp}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "relative flex items-center gap-3 overflow-hidden rounded-md px-3 py-2.5 text-xs transition-colors",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="admin-nav-active"
                          className="absolute inset-0 rounded-md bg-muted/60 dark:bg-muted/40"
                          transition={transitions.spring}
                        />
                      )}
                      <item.icon className="relative z-10 h-4 w-4" />
                      <span className="relative z-10">{t(item.labelKey)}</span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </motion.nav>

          <div className="border-t border-border/30 p-4">
            {userNav}
          </div>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
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
              <span className="sr-only">{t("common.dashboard")}</span>
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{t("nav.controlPanel")}</p>
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
