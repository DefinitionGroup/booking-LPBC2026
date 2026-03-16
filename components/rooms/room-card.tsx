"use client";

import { Users, Wifi, Monitor, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useI18n } from "@/components/i18n-provider";
import Image from "next/image";

export interface RoomProps {
    id: string;
    name: string;
    capacity: number;
    amenities: string[];
    isAvailable?: boolean; // Calculated field
    imageUrl?: string;
}

export function RoomCard({ room }: { room: RoomProps }) {
    const { t } = useI18n();
    const amenitiesList = {
        "Wifi": Wifi,
        "TV": Monitor,
    };

    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="group relative overflow-hidden rounded-lg bg-card shadow-sm transition-all hover:shadow-md cursor-pointer"
        >
            {/* Image Placeholder or Actual Image */}
            <div className="aspect-video w-full bg-secondary relative">
                {room.imageUrl ? (
                    <Image
                        src={room.imageUrl}
                        alt={room.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground/50">
                        {t("rooms.noImage")}
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                    <span className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs backdrop-blur-md",
                        room.isAvailable
                            ? "bg-green-500/10 text-green-700 dark:text-green-400"
                            : "bg-red-500/10 text-red-700 dark:text-red-400"
                    )}>
                        {room.isAvailable ? t("rooms.available") : t("rooms.occupied")}
                    </span>
                </div>
            </div>

            <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg tracking-tight">{room.name}</h3>
                    <div className="flex items-center text-muted-foreground text-xs gap-1">
                        <Users className="h-4 w-4" />
                        <span>{room.capacity}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-4">
                    {room.amenities.map((amenity) => {
                        const Icon = amenitiesList[amenity as keyof typeof amenitiesList] || CheckCircle2;
                        return (
                            <div key={amenity} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                                <Icon className="h-3.5 w-3.5" />
                                <span>{amenity}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </motion.div>
    );
}
