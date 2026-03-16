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
  busyDays: string[]; // array of "yyyy-MM-dd"
}

export function ScheduleShell({ bookings, currentDate, busyDays }: ScheduleShellProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const dateLocale = getDateFnsLocale(locale);

  const selected = parseISO(currentDate);
  const [viewDate, setViewDate] = useState(startOfMonth(selected));

  const busySet = new Set(busyDays);

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
        {/* Timeline — main area */}
        <div className="flex-1 min-w-0">
          <Timeline bookings={bookings} />
        </div>

        {/* Mini calendar sidebar */}
        <div className="w-full shrink-0 lg:w-64">
          <MiniCalendar
            selectedDate={selected}
            onSelectDate={handleSelectDate}
            viewDate={viewDate}
            onViewDateChange={setViewDate}
            busyDays={busySet}
          />
        </div>
      </div>
    </div>
  );
}
