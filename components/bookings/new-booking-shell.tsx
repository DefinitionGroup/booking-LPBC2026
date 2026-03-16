"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { BookingForm } from "@/components/bookings/booking-form";
import { useI18n } from "@/components/i18n-provider";

interface NewBookingShellProps {
  rooms: { id: string; name: string }[];
  mode: "app" | "admin";
  prefilledStartTime?: string;
  prefilledEndTime?: string;
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function NewBookingShell({
  rooms,
  mode,
  prefilledStartTime,
  prefilledEndTime,
}: NewBookingShellProps) {
  const { t } = useI18n();
  const backHref = mode === "admin" ? "/admin" : "/bookings";
  const backLabel = mode === "admin" ? t("bookings.backToAdmin") : t("bookings.backToBookings");

  return (
    <motion.div
      initial="initial"
      animate="animate"
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="mx-auto max-w-3xl"
    >
      <motion.div variants={fadeUp} transition={{ delay: 0.05 }}>
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      </motion.div>

      <motion.div
        variants={fadeUp}
        transition={{ delay: 0.1 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-card/95 shadow-sm"
      >
        <div className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative border-b border-border px-6 py-6 sm:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            {t("bookings.fastBookingFlow")}
          </div>
          <h1 className="mt-3 text-3xl tracking-tight">{t("bookings.newBookingRequest")}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("bookings.bookingFlowSubtitle")}
          </p>
        </div>

        <motion.div
          variants={fadeUp}
          transition={{ delay: 0.15 }}
          className="relative px-6 py-6 sm:px-8 sm:py-8"
        >
          <BookingForm
            rooms={rooms}
            prefilledStartTime={prefilledStartTime}
            prefilledEndTime={prefilledEndTime}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
