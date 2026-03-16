"use client";

import { LogOut, LayoutDashboard, ArrowLeft, Sun, Moon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useI18n } from "@/components/i18n-provider";

export function UserNavClient({ user, role }: { user: User; role?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const isAdminRoute = pathname.startsWith("/admin");
    const { t, locale, setLocale } = useI18n();
    const { setTheme, theme } = useTheme();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    return (
        <div className="flex flex-col gap-2">
            {/* User info */}
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-primary/95 flex items-center justify-center text-xs text-primary-foreground uppercase">
                    {user.email?.[0]}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="truncate text-xs leading-none">{user.email}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                        {role === "admin" ? t("roles.admin") : t("roles.user")}
                    </span>
                </div>
                <button
                    onClick={handleSignOut}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-destructive transition-colors"
                    title={t("nav.signOut")}
                >
                    <LogOut className="h-3.5 w-3.5" />
                </button>
            </div>

            {/* Controls row */}
            <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-1 rounded-full bg-muted/50 p-1">
                    <button
                        type="button"
                        onClick={() => setLocale("en")}
                        title={t("language.english")}
                        className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                            locale === "en"
                                ? "bg-emphasis text-emphasis-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        EN
                    </button>
                    <button
                        type="button"
                        onClick={() => setLocale("es")}
                        title={t("language.spanish")}
                        className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                            locale === "es"
                                ? "bg-emphasis text-emphasis-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        ES
                    </button>
                </div>
                <div className="ml-auto flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => setTheme("light")}
                        title={t("theme.light")}
                        className={cn(
                            "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors",
                            theme === "light"
                                ? "bg-muted text-foreground shadow-sm"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <Sun className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setTheme("dark")}
                        title={t("theme.dark")}
                        className={cn(
                            "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors",
                            theme === "dark"
                                ? "bg-muted text-foreground shadow-sm"
                                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <Moon className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Admin button */}
            {role === 'admin' && (
                <Link
                    href={isAdminRoute ? "/" : "/admin"}
                    className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-full bg-emphasis text-emphasis-foreground px-3 text-xs font-medium transition-colors hover:bg-emphasis/85"
                >
                    {isAdminRoute ? <ArrowLeft className="h-3.5 w-3.5" /> : <LayoutDashboard className="h-3.5 w-3.5" />}
                    <span>{isAdminRoute ? t("nav.backToApp") : t("common.admin")}</span>
                </Link>
            )}
        </div>
    );
}
