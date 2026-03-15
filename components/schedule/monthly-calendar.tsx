"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  addMonths,
  compareAsc,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock3, MapPin, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { getDateFnsLocale } from "@/lib/i18n/date-fns";

interface CalendarBooking {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  status: string;
  room?: { name: string } | null;
}

interface MonthlyCalendarProps {
  bookings: CalendarBooking[];
}

export function MonthlyCalendar({ bookings }: MonthlyCalendarProps) {
  const { t, locale } = useI18n();
  const dateLocale = getDateFnsLocale(locale);
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragMovedRef = useRef(false);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const bookingsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarBooking[]>();

    bookings.forEach((booking) => {
      const key = format(parseISO(booking.start_time), "yyyy-MM-dd");
      const existing = grouped.get(key) || [];
      existing.push(booking);
      grouped.set(key, existing);
    });

    grouped.forEach((dayBookings) => {
      dayBookings.sort(
        (a, b) =>
          new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      );
    });

    return grouped;
  }, [bookings]);

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerUp = () => setIsDragging(false);
    window.addEventListener("pointerup", handlePointerUp);
    return () => window.removeEventListener("pointerup", handlePointerUp);
  }, [isDragging]);

  const hasSelection = !!selectionStart;

  const normalizedSelection =
    selectionStart && selectionEnd
      ? compareAsc(selectionStart, selectionEnd) <= 0
        ? { start: selectionStart, end: selectionEnd }
        : { start: selectionEnd, end: selectionStart }
      : selectionStart
        ? { start: selectionStart, end: selectionStart }
        : null;

  const reserveHref = (() => {
    if (!normalizedSelection) return "/bookings/new";

    const start = new Date(normalizedSelection.start);
    start.setHours(9, 0, 0, 0);

    const end = new Date(normalizedSelection.end);
    if (isSameDay(normalizedSelection.start, normalizedSelection.end)) {
      end.setHours(10, 0, 0, 0);
    } else {
      end.setHours(17, 0, 0, 0);
    }

    const params = new URLSearchParams({
      start: format(start, "yyyy-MM-dd'T'HH:mm"),
      end: format(end, "yyyy-MM-dd'T'HH:mm"),
    });

    return `/bookings/new?${params.toString()}`;
  })();

  const selectionLabel = normalizedSelection
    ? isSameDay(normalizedSelection.start, normalizedSelection.end)
      ? format(normalizedSelection.start, "EEE, MMM d", { locale: dateLocale })
      : `${format(normalizedSelection.start, "MMM d", { locale: dateLocale })} - ${format(normalizedSelection.end, "MMM d", { locale: dateLocale })}`
    : "";

  const weekdayLabels = [
    t("calendar.weekdaySun"),
    t("calendar.weekdayMon"),
    t("calendar.weekdayTue"),
    t("calendar.weekdayWed"),
    t("calendar.weekdayThu"),
    t("calendar.weekdayFri"),
    t("calendar.weekdaySat"),
  ];

  const handleSelectDay = (day: Date) => {
    setSelectionStart(day);
    setSelectionEnd(day);
  };

  return (
    <>
      <div className="flex h-full min-h-[620px] flex-col">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold tracking-tight">
            {format(viewDate, "MMMM yyyy", { locale: dateLocale })}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewDate((prev) => subMonths(prev, 1))}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background/75 text-muted-foreground hover:text-foreground"
              aria-label={t("calendar.previousMonth")}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewDate(new Date())}
              className="rounded-lg border border-border bg-background/75 px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {t("common.today")}
            </button>
            <button
              type="button"
              onClick={() => setViewDate((prev) => addMonths(prev, 1))}
              className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background/75 text-muted-foreground hover:text-foreground"
              aria-label={t("calendar.nextMonth")}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {hasSelection && normalizedSelection && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background/75 px-3 py-2"
            >
              <span className="text-xs text-muted-foreground">
                {t("calendar.selected")}: <span className="font-medium text-foreground">{selectionLabel}</span>
              </span>
              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectionStart(null);
                    setSelectionEnd(null);
                    setIsDragging(false);
                  }}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("calendar.clear")}
                </button>
                <Link
                  href={reserveHref}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {t("calendar.reserveSelected")}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-7 gap-2 text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {weekdayLabels.map((day) => (
            <div key={day} className="px-2 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="mt-2 grid flex-1 grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd");
            const dayBookings = bookingsByDay.get(dayKey) || [];
            const inMonth = isSameMonth(day, monthStart);
            const inRange =
              !!normalizedSelection &&
              isWithinInterval(day, {
                start: normalizedSelection.start,
                end: normalizedSelection.end,
              });

            return (
              <div
                key={dayKey}
                onPointerDown={(event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest('[data-booking-item="true"]')) return;
                  dragMovedRef.current = false;
                  setIsDragging(true);
                  handleSelectDay(day);
                }}
                onPointerEnter={() => {
                  if (!isDragging || !selectionStart) return;
                  if (!selectionEnd || !isSameDay(day, selectionEnd)) {
                    dragMovedRef.current = true;
                  }
                  setSelectionEnd(day);
                }}
                onClick={(event) => {
                  const target = event.target as HTMLElement;
                  if (target.closest('[data-booking-item="true"]')) return;
                  if (dragMovedRef.current) {
                    dragMovedRef.current = false;
                    return;
                  }
                  handleSelectDay(day);
                }}
                className={cn(
                  "flex min-h-[108px] select-none flex-col rounded-xl border p-2 transition-colors",
                  inMonth
                    ? "border-border bg-background/70"
                    : "border-border/60 bg-background/35 text-muted-foreground",
                  inRange && "border-cyan-500/70 bg-cyan-500/10"
                )}
              >
                <div className="mb-2 text-xs font-medium">{format(day, "d")}</div>
                <div className="space-y-1.5">
                  {dayBookings.slice(0, 3).map((booking) => (
                    <button
                      key={booking.id}
                      type="button"
                      data-booking-item="true"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedBooking(booking);
                      }}
                      className="w-full truncate rounded-md border border-red-500/80 bg-red-600 px-2 py-1 text-left text-[11px] font-medium text-white transition-colors hover:bg-red-500"
                      title={booking.title}
                    >
                      {format(parseISO(booking.start_time), "h:mm a", { locale: dateLocale })} {booking.title}
                    </button>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="px-1 text-[11px] text-muted-foreground">
                      {t("calendar.moreItems", { count: dayBookings.length - 3 })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedBooking && (
          <>
            <motion.button
              type="button"
              aria-label={t("common.cancel")}
              className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
            />

            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
            >
              <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      {t("calendar.bookingDetails")}
                    </p>
                    <h4 className="mt-1 text-lg font-semibold">
                      {selectedBooking.title}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(null)}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock3 className="h-4 w-4" />
                    <span>
                      {format(parseISO(selectedBooking.start_time), "EEEE, MMM d • h:mm a", { locale: dateLocale })} -{" "}
                      {format(parseISO(selectedBooking.end_time), "h:mm a", { locale: dateLocale })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedBooking.room?.name || t("calendar.unknownRoom")}</span>
                  </div>
                  <div>
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                        selectedBooking.status === "approved"
                          ? "bg-green-500/15 text-green-700 dark:text-green-300"
                          : selectedBooking.status === "pending"
                            ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-300"
                            : "bg-red-500/15 text-red-700 dark:text-red-300"
                      )}
                    >
                      {t(`status.${selectedBooking.status}`)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
