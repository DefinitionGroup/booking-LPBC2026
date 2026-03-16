"use client";

import { LogOut, LayoutDashboard, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/i18n-provider";

export function UserNavClient({ user, role }: { user: User; role?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const isAdminRoute = pathname.startsWith("/admin");
    const { t } = useI18n();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    return (
        <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ModeToggle compact />

            {role === 'admin' && (
                <Link
                    href={isAdminRoute ? "/" : "/admin"}
                    className={cn(
                        "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs transition-colors",
                        isAdminRoute
                            ? "border-border bg-background/80 text-foreground hover:bg-muted/70"
                            : "border-transparent bg-primary/12 text-primary hover:bg-primary/20"
                    )}
                >
                    {isAdminRoute ? <ArrowLeft className="h-4 w-4" /> : <LayoutDashboard className="h-4 w-4" />}
                    <span className="hidden sm:inline">{isAdminRoute ? t("nav.backToApp") : t("common.admin")}</span>
                </Link>
            )}

            <div className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-1.5">
                <div className="flex flex-col items-end">
                    <span className="max-w-[160px] truncate text-xs leading-none">{user.email}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                        {role === "admin" ? t("roles.admin") : t("roles.user")}
                    </span>
                </div>

                <div className="h-8 w-8 rounded-full bg-primary/95 flex items-center justify-center text-xs text-primary-foreground uppercase">
                    {user.email?.[0]}
                </div>

                <button
                    onClick={handleSignOut}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title={t("nav.signOut")}
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
