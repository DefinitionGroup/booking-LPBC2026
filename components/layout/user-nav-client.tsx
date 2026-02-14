"use client";

import { LogOut, LayoutDashboard, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function UserNavClient({ user, role }: { user: User; role?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const isAdminRoute = pathname.startsWith("/admin");

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    return (
        <div className="flex items-center gap-4">
            {role === 'admin' && (
                <Link
                    href={isAdminRoute ? "/" : "/admin"}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                        isAdminRoute
                            ? "bg-muted hover:bg-muted/80 text-foreground"
                            : "bg-primary/10 hover:bg-primary/20 text-primary"
                    )}
                >
                    {isAdminRoute ? <ArrowLeft className="h-4 w-4" /> : <LayoutDashboard className="h-4 w-4" />}
                    <span className="hidden sm:inline">{isAdminRoute ? "Back to App" : "Admin"}</span>
                </Link>
            )}

            <div className="flex items-center gap-3 pl-4 border-l border-border h-8">
                <div className="flex flex-col items-end">
                    <span className="text-xs font-medium leading-none">{user.email}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{role || 'User'}</span>
                </div>

                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground uppercase">
                    {user.email?.[0]}
                </div>

                <button
                    onClick={handleSignOut}
                    className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                    title="Sign Out"
                >
                    <LogOut className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
