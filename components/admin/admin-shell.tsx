"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { transitions, variants } from "@/components/ui/motion";
import {
  LayoutDashboard,
  Building2,
  Layers,
  DoorOpen,
  CalendarPlus,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

interface AdminShellProps {
  children: React.ReactNode;
  userNav?: React.ReactNode;
}

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings/new", label: "New Booking", icon: CalendarPlus },
  { href: "/admin/buildings", label: "Buildings", icon: Building2 },
  { href: "/admin/floors", label: "Floors", icon: Layers },
  { href: "/admin/rooms", label: "Rooms", icon: DoorOpen },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children, userNav }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle =
    navItems.find((item) => isActivePath(pathname, item.href))?.label ?? "Admin";

  return (
    <div className="relative min-h-screen text-foreground">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            type="button"
            aria-label="Close sidebar"
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
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">Admin Console</div>
                <div className="text-[11px] text-muted-foreground">Operations + approvals</div>
              </div>
            </div>
            <button
              type="button"
              className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close sidebar"
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
                        "relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "text-foreground"
                          : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="admin-nav-active"
                          className="absolute inset-0 rounded-xl border border-border/80 bg-gradient-to-r from-white/70 to-white/40 dark:from-white/10 dark:to-white/5"
                          transition={transitions.spring}
                        />
                      )}
                      <item.icon className="relative z-10 h-4 w-4" />
                      <span className="relative z-10">{item.label}</span>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          </motion.nav>
        </motion.aside>

        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4">
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
              <span className="sr-only">Open sidebar</span>
              <Menu className="h-5 w-5" />
            </button>

            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Control Panel</p>
              <p className="truncate text-sm font-semibold">{pageTitle}</p>
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
