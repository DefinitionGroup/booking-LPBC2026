"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addMinutes, differenceInMinutes, format } from "date-fns";
import type { Locale as DateFnsLocale } from "date-fns";
import { Loader2, Timer, Users, DoorOpen, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createBooking } from "@/actions/bookings";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useI18n } from "@/components/i18n-provider";
import { getDateFnsLocale } from "@/lib/i18n/date-fns";

const bookingSchema = z.object({
  title: z.string().min(3, "bookings.validationTitleMin"),
  description: z.string().optional(),
  date: z.string().min(1, "bookings.validationDateRequired"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "bookings.validationTimeInvalid"),
  durationMinutes: z
    .number({ error: "bookings.validationDurationRequired" })
    .min(30, "bookings.validationDurationMin")
    .max(300, "bookings.validationDurationMax"),
  roomId: z.string().min(1, "bookings.validationRoomRequired"),
  recurrence: z.enum(["none", "daily", "weekly"]),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  rooms: { id: string; name: string; capacity: number | null; image_url: string | null }[];
  preselectedRoomId?: string;
  prefilledStartTime?: string;
  prefilledEndTime?: string;
}

const QUICK_DURATIONS = [30, 60, 90, 120, 180, 240, 300];

function parseDateTime(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function clampDuration(duration: number) {
  if (Number.isNaN(duration)) return 60;
  return Math.min(300, Math.max(30, duration));
}

function roundToNextQuarter(date: Date) {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const delta = (15 - (minutes % 15)) % 15;
  rounded.setMinutes(minutes + delta, 0, 0);
  return rounded;
}

function buildTimeOptions(locale: DateFnsLocale) {
  return Array.from({ length: 48 }, (_, index) => {
    const hour = Math.floor(index / 2);
    const minute = index % 2 === 0 ? 0 : 30;
    const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const label = format(new Date(`2000-01-01T${value}:00`), "h:mm a", { locale });
    return { value, label };
  });
}

export function BookingForm({
  rooms,
  preselectedRoomId,
  prefilledStartTime,
  prefilledEndTime,
}: BookingFormProps) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const dateLocale = getDateFnsLocale(locale);

  const prefilledStart = parseDateTime(prefilledStartTime);
  const prefilledEnd = parseDateTime(prefilledEndTime);
  const baseStart = prefilledStart ?? roundToNextQuarter(new Date());
  const baseDuration =
    prefilledStart && prefilledEnd
      ? clampDuration(differenceInMinutes(prefilledEnd, prefilledStart))
      : 60;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      title: "",
      description: "",
      date: format(baseStart, "yyyy-MM-dd"),
      time: format(baseStart, "HH:mm"),
      durationMinutes: baseDuration,
      roomId: preselectedRoomId || "",
      recurrence: "none",
    },
  });

  const timeOptions = useMemo(() => buildTimeOptions(dateLocale), [dateLocale]);
  const getErrorMessage = (message?: string) => (message ? t(message) : "");
  const [watchedDate, watchedTime, durationMinutesRaw] = useWatch({
    control,
    name: ["date", "time", "durationMinutes"],
  });
  const durationMinutes = durationMinutesRaw || 60;

  const preview = useMemo(() => {
    if (!watchedDate || !watchedTime) return null;
    const start = new Date(`${watchedDate}T${watchedTime}:00`);
    if (Number.isNaN(start.getTime())) return null;
    const end = addMinutes(start, durationMinutes || 0);
    return { start, end };
  }, [watchedDate, watchedTime, durationMinutes]);

  const handleFormSubmit = async (data: BookingFormValues) => {
    const start = new Date(`${data.date}T${data.time}:00`);
    if (Number.isNaN(start.getTime())) {
      toast.error(t("bookings.invalidDateTime"));
      return;
    }

    const end = addMinutes(start, data.durationMinutes);

    try {
      const result = await createBooking(null, {
        title: data.title,
        description: data.description,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        roomId: data.roomId,
        recurrence: data.recurrence,
      });

      if (result.success) {
        toast.success(t("bookings.bookingSubmitted"));
        router.push("/bookings");
        router.refresh();
      } else {
        toast.error(result.message ? t(result.message) : t("bookings.bookingFailed"));
      }
    } catch (error) {
      toast.error(t("bookings.bookingFailed"));
      console.error(error);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const item = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="space-y-5"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item} className="space-y-2">
        <label className="text-xs">{t("bookings.meetingTitle")}</label>
        <input
          {...register("title")}
          className={cn(
            "flex h-10 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0",
            errors.title && "border-destructive focus-visible:ring-destructive"
          )}
          placeholder={t("bookings.titlePlaceholder")}
        />
        {errors.title && <p className="text-xs text-destructive">{getErrorMessage(errors.title.message)}</p>}
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs">{t("bookings.date")}</label>
          <input
            type="date"
            {...register("date")}
            className="flex h-10 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-0"
          />
          {errors.date && <p className="text-xs text-destructive">{getErrorMessage(errors.date.message)}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-xs">{t("bookings.startTime")}</label>
          <select
            {...register("time")}
            className="flex h-10 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.time && <p className="text-xs text-destructive">{getErrorMessage(errors.time.message)}</p>}
        </div>
      </motion.div>

      <motion.div variants={item} className="rounded-md bg-muted/40 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="text-xs">{t("bookings.duration")}</label>
          <div className="inline-flex items-center gap-2 rounded-md bg-muted/60 px-2 py-1 text-xs text-muted-foreground">
            <Timer className="h-3.5 w-3.5" />
            {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
          </div>
        </div>

        <input
          type="range"
          min={30}
          max={300}
          step={15}
          value={durationMinutes}
          onChange={(event) =>
            setValue("durationMinutes", Number(event.target.value), {
              shouldValidate: true,
            })
          }
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-primary"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_DURATIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() =>
                setValue("durationMinutes", minutes, {
                  shouldValidate: true,
                })
              }
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs transition-colors",
                durationMinutes === minutes
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label className="text-xs text-muted-foreground">{t("bookings.manualMinutes")}</label>
          <input
            type="number"
            min={30}
            max={300}
            step={15}
            value={durationMinutes}
            onChange={(event) =>
              setValue("durationMinutes", clampDuration(Number(event.target.value)), {
                shouldValidate: true,
              })
            }
            className="h-9 w-24 rounded-md border border-border/60 bg-background px-2 py-1 text-xs"
          />
        </div>
        {errors.durationMinutes && (
          <p className="mt-2 text-xs text-destructive">{getErrorMessage(errors.durationMinutes.message)}</p>
        )}
      </motion.div>

      <motion.div variants={item} className="rounded-md bg-muted/30 px-3 py-2 text-xs">
        {preview ? (
          <span className="text-muted-foreground">
            {t("bookings.endsAt")}{" "}
            <span className="text-foreground">
              {format(preview.end, "EEE, MMM d • h:mm a", { locale: dateLocale })}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">{t("bookings.pickDateTimeForEndPreview")}</span>
        )}
      </motion.div>

      <motion.div variants={item} className="space-y-2">
        <label className="text-xs">{t("bookings.room")}</label>
        <input type="hidden" {...register("roomId")} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {rooms.map((room) => {
            const selected = useWatch({ control, name: "roomId" }) === room.id;
            return (
              <button
                key={room.id}
                type="button"
                onClick={() => setValue("roomId", room.id, { shouldValidate: true })}
                className={cn(
                  "group relative flex items-start gap-3 rounded-xl border p-3 text-left transition-all",
                  selected
                    ? "border-emphasis bg-emphasis/5 ring-1 ring-emphasis/40"
                    : "border-border/60 bg-background hover:border-border hover:bg-muted/30"
                )}
              >
                {/* Thumbnail */}
                <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg">
                  {room.image_url ? (
                    <img
                      src={room.image_url}
                      alt={room.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary">
                      <DoorOpen className="h-5 w-5 text-muted-foreground/40" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-xs font-medium", selected && "text-emphasis")}>{room.name}</p>
                  {room.capacity && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {room.capacity}
                    </p>
                  )}
                </div>

                {/* Check */}
                {selected && (
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emphasis text-emphasis-foreground">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {errors.roomId && <p className="text-xs text-destructive">{getErrorMessage(errors.roomId.message)}</p>}
      </motion.div>

      <motion.div variants={item} className="space-y-2">
        <label className="text-xs">{t("bookings.recurrence")}</label>
        <select
          {...register("recurrence")}
          className="flex h-10 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <option value="none">{t("bookings.doesNotRepeat")}</option>
          <option value="daily">{t("bookings.daily")}</option>
          <option value="weekly">{t("bookings.weekly")}</option>
        </select>
      </motion.div>

      <motion.div variants={item} className="pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-emphasis px-4 py-2 text-xs font-medium text-emphasis-foreground shadow-sm transition-colors hover:bg-emphasis/85 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("bookings.bookingSubmitting")}
            </>
          ) : (
            t("bookings.requestBooking")
          )}
        </button>
      </motion.div>
    </motion.form>
  );
}
