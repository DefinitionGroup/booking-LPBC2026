import { getSiteSettings } from "@/actions/site-settings";
import { updateSiteSettings } from "@/actions/site-settings";
import { HeroImageUpload } from "@/components/admin/hero-image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default async function AdminSettingsPage(props: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const settings = await getSiteSettings();

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-3xl tracking-tight">Site Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Customize the branding and appearance of the platform.
        </p>
      </div>

      {searchParams.success && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Settings saved successfully.
        </div>
      )}

      {searchParams.error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <form action={updateSiteSettings} className="space-y-8">
        {/* Project Name */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-medium">Project Name</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Displayed in the browser title and on the home page hero.
            </p>
          </div>
          <div className="space-y-2 max-w-sm">
            <Label htmlFor="project_name">Name</Label>
            <Input
              id="project_name"
              name="project_name"
              defaultValue={settings.project_name}
              placeholder="Equinox"
              required
              minLength={1}
              maxLength={100}
            />
          </div>
        </div>

        {/* Hero Background Image */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-medium">Home Page Background Image</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Drag and drop a high-resolution image for the home page hero section.
            </p>
          </div>
          <HeroImageUpload currentUrl={settings.hero_image_url} name="hero_image_url" />
        </div>

        <div className="flex justify-end">
          <Button type="submit">Save Settings</Button>
        </div>
      </form>
    </div>
  );
}
