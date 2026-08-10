"use client";

import { format } from "date-fns";
import { useI18n } from "@/components/i18n-provider";
import { getDateFnsLocale } from "@/lib/i18n/date-fns";
import { BookingActions } from "@/components/bookings/booking-actions";

interface Booking {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    status: "pending" | "approved" | "rejected" | "cancelled";
    rooms?: { name: string } | null;
    creator?: { email: string } | null;
    responsible?: { email: string } | null;
}

export function AdminBookingTable({ bookings, emptyMessage }: { bookings: Booking[]; emptyMessage?: string }) {
    const { t, locale } = useI18n();
    const dateLocale = getDateFnsLocale(locale);

    return (
        <div className="rounded-lg bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-xs text-left">
                    <thead className="bg-secondary/50 text-muted-foreground border-b border-border/30">
                        <tr>
                            <th className="px-6 py-3">{t("common.status")}</th>
                            <th className="px-6 py-3">{t("bookings.tableTitle")}</th>
                            <th className="px-6 py-3">{t("bookings.room")}</th>
                            <th className="px-6 py-3">{t("bookings.createdBy")}</th>
                            <th className="px-6 py-3">{t("bookings.responsiblePerson")}</th>
                            <th className="px-6 py-3">{t("bookings.startTime")}</th>
                            <th className="px-6 py-3 text-right">{t("common.actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {bookings.length > 0 ? (
                            bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs">
                                            {t(`status.${booking.status}`)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{booking.title}</td>
                                    <td className="px-6 py-4">{booking.rooms?.name || t("calendar.unknownRoom")}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{booking.creator?.email}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{booking.responsible?.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-xs">
                                            <span>{format(new Date(booking.start_time), "MMM d", { locale: dateLocale })}</span>
                                            <span className="text-muted-foreground">
                                                {format(new Date(booking.start_time), "h:mm a", { locale: dateLocale })} - {format(new Date(booking.end_time), "h:mm a", { locale: dateLocale })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <BookingActions booking={booking} mode="admin" />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                                    {emptyMessage || t("admin.pendingNone")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
