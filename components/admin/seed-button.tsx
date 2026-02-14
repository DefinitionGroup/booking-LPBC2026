"use client";

import { useState } from "react";
import { Database, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { seedDatabase } from "@/actions/seed";
import { useRouter } from "next/navigation";

export function SeedButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSeed = async () => {
    setIsLoading(true);
    try {
      const result = await seedDatabase();
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSeed}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-md bg-secondary border border-border px-3 py-2 text-sm font-medium text-secondary-foreground transition-all hover:bg-secondary/80 hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Database className="h-4 w-4" />
      )}
      {isLoading ? "Seeding..." : "Seed Data"}
    </button>
  );
}
