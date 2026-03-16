import { AppShell } from "@/components/layout/app-shell";
import { UserNav } from "@/components/layout/user-nav";
import { getSiteSettings } from "@/actions/site-settings";

export async function ShellWrapper({ children }: { children: React.ReactNode }) {
    const settings = await getSiteSettings();
    return (
        <AppShell userNav={<UserNav />} appName={settings.project_name}>
            {children}
        </AppShell>
    );
}
