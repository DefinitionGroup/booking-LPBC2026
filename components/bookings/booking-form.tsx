"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createBooking } from "@/actions/bookings";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

// Zod Schema
const bookingSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().optional(),
    startTime: z.string().refine((val) => new Date(val) > new Date(), {
        message: "Start time must be in the future",
    }),
    endTime: z.string(),
    roomId: z.string().min(1, "Please select a room"),
    recurrence: z.enum(["none", "daily", "weekly"]),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
    message: "End time must be after start time",
    path: ["endTime"],
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingFormProps {
    rooms: { id: string; name: string }[];
    preselectedRoomId?: string;
}

export function BookingForm({ rooms, preselectedRoomId }: BookingFormProps) {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<BookingFormValues>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            roomId: preselectedRoomId || "",
            recurrence: "none",
        },
    });

    const handleFormSubmit = async (data: BookingFormValues) => {
        try {
            const result = await createBooking(null, data);
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
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.06,
            },
        },
    };

    const item = {
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0 },
    };

    return (
        <motion.form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-4"
            variants={container}
            initial="hidden"
            animate="show"
        >
            <motion.div variants={item} className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Meeting Title
                </label>
                <input
                    {...register("title")}
                    className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                        errors.title && "border-destructive focus-visible:ring-destructive"
                    )}
                    placeholder="Strategy Sync"
                />
                {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
            </motion.div>

            <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Start Time</label>
                    <input
                        type="datetime-local"
                        {...register("startTime")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    {errors.startTime && (
                        <p className="text-sm text-destructive">{errors.startTime.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">End Time</label>
                    <input
                        type="datetime-local"
                        {...register("endTime")}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    />
                    {errors.endTime && (
                        <p className="text-sm text-destructive">{errors.endTime.message}</p>
                    )}
                </div>
            </motion.div>

            <motion.div variants={item} className="space-y-2">
                <label className="text-sm font-medium">Room</label>
                <select
                    {...register("roomId")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="" disabled>Select a room</option>
                    {rooms.map(room => (
                        <option key={room.id} value={room.id}>{room.name}</option>
                    ))}
                </select>
                {errors.roomId && (
                    <p className="text-sm text-destructive">{errors.roomId.message}</p>
                )}
            </motion.div>

            <motion.div variants={item} className="space-y-2">
                <label className="text-sm font-medium">Recurrence</label>
                <select
                    {...register("recurrence")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                </select>
            </motion.div>

            <motion.div variants={item} className="pt-2">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full"
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
