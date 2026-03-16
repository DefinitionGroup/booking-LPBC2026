"use client";

import { useState } from "react";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { seedDatabase } from "@/actions/seed";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";

export function SeedButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { t } = useI18n();

  const handleSeed = async () => {
    setIsLoading(true);
    try {
      const result = await seedDatabase();
      if (result.success) {
        toast.success(t("admin.seedData"));
        router.refresh();
      } else {
        toast.error(result.message ? t(result.message) : t("errors.generic"));
      }
    } catch {
      toast.error(t("errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSeed}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-md bg-secondary border border-border px-3 py-2 text-xs text-secondary-foreground transition-all hover:bg-secondary/80 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      {isLoading ? t("admin.seeding") : t("admin.seedData")}
    </button>
  );
}
