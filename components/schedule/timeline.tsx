import { format, differenceInMinutes, startOfDay, addHours } from "date-fns";
import { cn } from "@/lib/utils";

interface Booking {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    room?: { name: string };
    status: string;
}

export function Timeline({ bookings }: { bookings: Booking[] }) {
    const startHour = 8; // 8 AM
    const endHour = 19; // 7 PM
    const totalHours = endHour - startHour;
    const hourHeight = 80; // px

    const hours = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i);

    return (
        <div className="relative border border-border rounded-xl bg-card shadow-sm overflow-hidden">
            {/* Header (Rooms, etc - simplified to just time for now) */}
            <div className="flex border-b border-border">
                <div className="w-16 flex-shrink-0 border-r border-border bg-secondary/30 p-4"></div>
                <div className="flex-1 p-4 font-medium text-sm text-center bg-secondary/10">All Rooms</div>
            </div>

            <div className="relative overflow-y-auto" style={{ height: `${totalHours * hourHeight}px` }}>
                {/* Grid Lines */}
                {hours.map((hour) => (
                    <div
                        key={hour}
                        className="absolute w-full border-b border-border/50 flex items-start"
                        style={{ top: `${(hour - startHour) * hourHeight}px`, height: `${hourHeight}px` }}
                    >
                        <div className="w-16 flex-shrink-0 -mt-2.5 text-xs text-muted-foreground text-right pr-4">
                            {format(new Date().setHours(hour, 0), "h a")}
                        </div>
                        {/* Horizontal Line part is the border-b of this div */}
                    </div>
                ))}

                {/* Events */}
                <div className="absolute top-0 left-16 right-0 bottom-0">
                    {bookings.map((booking) => {
                        const start = new Date(booking.start_time);
                        const end = new Date(booking.end_time);

                        // Simple logic for current day view (assuming filtered bookings are for today)
                        // Calculate "minutes from 8 AM"
                        const startMinutes = (start.getHours() - startHour) * 60 + start.getMinutes();
                        // const duration = differenceInMinutes(end, start);

                        const top = (startMinutes / 60) * hourHeight;
                        const durationMinutes = differenceInMinutes(end, start);
                        const height = (durationMinutes / 60) * hourHeight;

                        return (
                            <div
                                key={booking.id}
                                className={cn(
                                    "absolute left-2 right-2 rounded-md p-2 text-xs border border-l-4 overflow-hidden hover:z-10 transition-all cursor-pointer shadow-sm",
                                    booking.status === 'approved'
                                        ? "bg-green-500/10 border-green-500 text-green-900 dark:text-green-100"
                                        : "bg-blue-500/10 border-blue-500 text-blue-900 dark:text-blue-100"
                                )}
                                style={{ top: `${top}px`, height: `${height}px` }}
                            >
                                <div className="font-semibold truncate">{booking.title}</div>
                                <div className="text-muted-foreground truncate">{booking.room?.name}</div>
                                <div className="opacity-75">{format(start, "h:mm")} - {format(end, "h:mm")}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
