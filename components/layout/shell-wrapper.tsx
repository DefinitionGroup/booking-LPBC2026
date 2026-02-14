import { AppShell } from "@/components/layout/app-shell";
import { UserNav } from "@/components/layout/user-nav";

export function ShellWrapper({ children }: { children: React.ReactNode }) {
    return (
        <AppShell userNav={<UserNav />}>
            {children}
        </AppShell>
    );
}
