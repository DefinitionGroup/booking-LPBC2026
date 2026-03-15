"use client";

import { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { addMinutes, differenceInMinutes, format } from "date-fns";
import { Loader2, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createBooking } from "@/actions/bookings";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const bookingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  date: z.string().min(1, "Please pick a date"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Please pick a valid time"),
  durationMinutes: z
    .number({ invalid_type_error: "Duration is required" })
    .min(30, "Minimum is 30 minutes")
    .max(300, "Maximum is 5 hours"),
  roomId: z.string().min(1, "Please select a room"),
  recurrence: z.enum(["none", "daily", "weekly"]),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingFormProps {
  rooms: { id: string; name: string }[];
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

function buildTimeOptions() {
  return Array.from({ length: 48 }, (_, index) => {
    const hour = Math.floor(index / 2);
    const minute = index % 2 === 0 ? 0 : 30;
    const value = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    const label = format(new Date(`2000-01-01T${value}:00`), "h:mm a");
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

  const prefilledStart = parseDateTime(prefilledStartTime);
  const prefilledEnd = parseDateTime(prefilledEndTime);
  const baseStart = prefilledStart ?? roundToNextQuarter(addMinutes(new Date(), 30));
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

  const timeOptions = useMemo(() => buildTimeOptions(), []);
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
      toast.error("Invalid start date/time.");
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
        toast.success("Booking request submitted!");
        router.push("/bookings");
        router.refresh();
      } else {
        toast.error(result.message || "Failed to submit booking.");
      }
    } catch (error) {
      toast.error("Failed to submit booking.");
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
        <label className="text-sm font-medium">Meeting Title</label>
        <input
          {...register("title")}
          className={cn(
            "flex h-10 w-full rounded-xl border border-input bg-background/88 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            errors.title && "border-destructive focus-visible:ring-destructive"
          )}
          placeholder="Strategy Sync"
        />
        {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium">Date</label>
          <input
            type="date"
            {...register("date")}
            className="flex h-10 w-full rounded-xl border border-input bg-background/88 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
          {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Start Time</label>
          <select
            {...register("time")}
            className="flex h-10 w-full rounded-xl border border-input bg-background/88 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {timeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.time && <p className="text-sm text-destructive">{errors.time.message}</p>}
        </div>
      </motion.div>

      <motion.div variants={item} className="rounded-xl border border-border bg-background/60 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <label className="text-sm font-medium">Duration</label>
          <div className="inline-flex items-center gap-2 rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground">
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
                "rounded-lg border px-2.5 py-1 text-xs transition-colors",
                durationMinutes === minutes
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <label className="text-xs text-muted-foreground">Manual minutes</label>
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
            className="h-9 w-24 rounded-lg border border-input bg-background px-2 py-1 text-sm"
          />
        </div>
        {errors.durationMinutes && (
          <p className="mt-2 text-sm text-destructive">{errors.durationMinutes.message}</p>
        )}
      </motion.div>

      <motion.div variants={item} className="rounded-xl border border-border bg-background/55 px-3 py-2 text-sm">
        {preview ? (
          <span className="text-muted-foreground">
            Ends at{" "}
            <span className="font-medium text-foreground">
              {format(preview.end, "EEE, MMM d • h:mm a")}
            </span>
          </span>
        ) : (
          <span className="text-muted-foreground">Pick a date and time to see end time.</span>
        )}
      </motion.div>

      <motion.div variants={item} className="space-y-2">
        <label className="text-sm font-medium">Room</label>
        <select
          {...register("roomId")}
          className="flex h-10 w-full rounded-xl border border-input bg-background/88 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="" disabled>
            Select a room
          </option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </select>
        {errors.roomId && <p className="text-sm text-destructive">{errors.roomId.message}</p>}
      </motion.div>

      <motion.div variants={item} className="space-y-2">
        <label className="text-sm font-medium">Recurrence</label>
        <select
          {...register("recurrence")}
          className="flex h-10 w-full rounded-xl border border-input bg-background/88 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="none">Does not repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
      </motion.div>

      <motion.div variants={item} className="pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Booking...
            </>
          ) : (
            "Request Booking"
          )}
        </button>
      </motion.div>
    </motion.form>
  );
}
