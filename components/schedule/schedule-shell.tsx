"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO, startOfMonth } from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";
import { MiniCalendar } from "./mini-calendar";
import { Timeline } from "./timeline";
import { useI18n } from "@/components/i18n-provider";
import { getDateFnsLocale } from "@/lib/i18n/date-fns";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  room?: { name: string };
  status: string;
}

interface ScheduleShellProps {
  bookings: Booking[];
  currentDate: string; // "yyyy-MM-dd"
  bookingCounts: Record<string, number>;
}

export function ScheduleShell({ bookings, currentDate, bookingCounts }: ScheduleShellProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const dateLocale = getDateFnsLocale(locale);

  const selected = parseISO(currentDate);
  const [viewDate, setViewDate] = useState(startOfMonth(selected));

  const handleSelectDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    router.push(`/schedule?date=${dateStr}`);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl tracking-tight">{t("schedule.title")}</h1>
          <p className="text-muted-foreground">
            {format(selected, "EEEE, MMMM d, yyyy", { locale: dateLocale })}
          </p>
        </div>
        <Link
          href={`/bookings/new?start=${format(selected, "yyyy-MM-dd'T'09:00")}&end=${format(selected, "yyyy-MM-dd'T'10:00")}`}
          className="inline-flex items-center gap-2 rounded-full bg-emphasis px-4 py-2 text-xs font-medium text-emphasis-foreground shadow-sm transition-colors hover:bg-emphasis/85"
        >
          <Plus className="h-4 w-4" />
          {t("common.newBooking")}
        </Link>
      </div>

      <div className="flex flex-col-reverse gap-6 lg:flex-row">
        {/* Day content — compact list + timeline */}
        <div className="flex flex-1 min-w-0 flex-col gap-4">
          {/* Compact booking list */}
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {bookings.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {t("schedule.noBookings")}
              </p>
            ) : (
              <ul>
                {[...bookings]
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((b) => {
                    const start = parseISO(b.start_time);
                    const end = parseISO(b.end_time);
                    return (
                      <li
                        key={b.id}
                        className="flex items-center gap-3 border-b border-border/50 px-4 py-2 text-sm last:border-0 hover:bg-muted/30 transition-colors"
                      >
                        <span className="w-24 shrink-0 tabular-nums text-xs text-muted-foreground">
                          {format(start, "HH:mm", { locale: dateLocale })} –{" "}
                          {format(end, "HH:mm", { locale: dateLocale })}
                        </span>
                        <span className="flex-1 truncate font-medium">{b.title}</span>
                        {b.room && (
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {b.room.name}
                          </span>
                        )}
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium",
                            b.status === "approved"
                              ? "bg-green-500/15 text-green-700 dark:text-green-300"
                              : "bg-blue-500/15 text-blue-700 dark:text-blue-300"
                          )}
                        >
                          {t(`status.${b.status}` as never)}
                        </span>
                      </li>
                    );
                  })}
              </ul>
            )}
          </div>
          <Timeline bookings={bookings} />
        </div>

        {/* Mini calendar sidebar */}
        <div className="w-full shrink-0 lg:w-64">
          <MiniCalendar
            selectedDate={selected}
            onSelectDate={handleSelectDate}
            viewDate={viewDate}
            onViewDateChange={setViewDate}
            bookingCounts={bookingCounts}
          />
        </div>
      </div>
    </div>
  );
}
