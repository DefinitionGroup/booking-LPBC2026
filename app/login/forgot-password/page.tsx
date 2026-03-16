import { resetPassword } from "../actions";
import { Building2, ArrowLeft, Mail, CheckCircle2 } from "lucide-react";
import { getServerI18n } from "@/lib/i18n/server";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { getSiteSettings } from "@/actions/site-settings";

export default async function ForgotPasswordPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const error = searchParams.error;
  const success = searchParams.success === "true";
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
            <h1 className="text-2xl tracking-tight text-white">{t("auth.forgotPasswordTitle")}</h1>
            <p className="text-xs text-white/70">{t("auth.forgotPasswordSubtitle")}</p>
          </div>
        </div>

        {typeof error === "string" && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {success ? (
          <Card>
            <CardContent className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-2 rounded-md bg-emerald-500/10 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {t("auth.resetEmailSent")}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("auth.resetEmailSentHint")}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-primary transition-colors hover:text-primary/80"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {t("auth.backToLogin")}
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <form className="flex flex-col gap-5">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="pl-9"
                      placeholder={t("auth.emailPlaceholder")}
                    />
                  </div>
                </div>
                <Button type="submit" formAction={resetPassword} className="w-full">
                  {t("auth.sendResetLink")}
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
        )}
      </div>
    </div>
  );
}
