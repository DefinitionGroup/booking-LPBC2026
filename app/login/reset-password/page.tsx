import { updatePassword } from "../actions";
import { Building2, ArrowLeft, Lock } from "lucide-react";
import { getServerI18n } from "@/lib/i18n/server";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/actions/site-settings";

export default async function ResetPasswordPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const error = searchParams.error;
  const { t } = await getServerI18n();
  const settings = await getSiteSettings();

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-6">
      {settings.hero_image_url ? (
        <Image src={settings.hero_image_url} alt="" fill className="object-cover" priority />
      ) : (
        <div className="absolute inset-0 bg-background" />
      )}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl tracking-tight text-white">{t("auth.resetPasswordTitle")}</h1>
            <p className="text-xs text-white/70">{t("auth.resetPasswordSubtitle")}</p>
          </div>
        </div>

        {typeof error === "string" && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-xs text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardContent>
            <form className="flex flex-col gap-5">
              <div className="space-y-2">
                <Label htmlFor="password">{t("auth.newPassword")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    minLength={6}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    minLength={6}
                    className="pl-9"
                  />
                </div>
              </div>
              <Button type="submit" formAction={updatePassword} className="w-full">
                {t("auth.updatePassword")}
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("auth.backToLogin")}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
