"use client";

import { updateBookingStatus } from "@/actions/bookings";
import { format } from "date-fns";
import { Check, X, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/components/i18n-provider";
import { getDateFnsLocale } from "@/lib/i18n/date-fns";

interface Booking {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    status: string;
    rooms?: { name: string } | null;
    profiles?: { email: string } | null;
}

export function AdminBookingTable({ bookings }: { bookings: Booking[] }) {
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { t, locale } = useI18n();
    const dateLocale = getDateFnsLocale(locale);

    const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
        setProcessingId(id);
        try {
            const result = await updateBookingStatus(id, status);
            if (result.success) {
                toast.success(t("admin.bookingsUpdated", { status: t(`status.${status}`) }));
            } else {
                toast.error(result.message ? t(result.message) : t("errors.generic"));
            }
        } catch {
            toast.error(t("errors.generic"));
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="rounded-lg bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-xs text-left">
                    <thead className="bg-secondary/50 text-muted-foreground border-b border-border/30">
                        <tr>
                            <th className="px-6 py-3">{t("admin.queued")}</th>
                            <th className="px-6 py-3">{t("bookings.tableTitle")}</th>
                            <th className="px-6 py-3">{t("bookings.room")}</th>
                            <th className="px-6 py-3">{t("bookings.tableUser")}</th>
                            <th className="px-6 py-3">{t("bookings.startTime")}</th>
                            <th className="px-6 py-3 text-right">{t("common.actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {bookings.length > 0 ? (
                            bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-muted/50 transition-colors">
                                    <td className="px-6 py-4 text-muted-foreground text-xs">
                                        {/* Ideally created_at diff */}
                                        {t("admin.new")}
                                    </td>
                                    <td className="px-6 py-4">{booking.title}</td>
                                    <td className="px-6 py-4">{booking.rooms?.name || t("calendar.unknownRoom")}</td>
                                    <td className="px-6 py-4 text-muted-foreground">{booking.profiles?.email}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col text-xs">
                                            <span>{format(new Date(booking.start_time), "MMM d", { locale: dateLocale })}</span>
                                            <span className="text-muted-foreground">
                                                {format(new Date(booking.start_time), "h:mm a", { locale: dateLocale })} - {format(new Date(booking.end_time), "h:mm a", { locale: dateLocale })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleStatusChange(booking.id, 'approved')}
                                                disabled={!!processingId}
                                                className="p-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 disabled:opacity-50"
                                                title={t("admin.approve")}
                                            >
                                                {processingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleStatusChange(booking.id, 'rejected')}
                                                disabled={!!processingId}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 disabled:opacity-50"
                                                title={t("admin.reject")}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                    {t("admin.pendingNone")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
