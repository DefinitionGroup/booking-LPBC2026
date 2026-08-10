"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState, useCallback, useRef } from "react";
import { upload as uploadBlob } from "@vercel/blob/client";
import {
  ImagePlus,
  X,
  Upload,
  Loader2,
  Wifi,
  Monitor,
  Presentation,
  Phone,
  Printer,
  Coffee,
  Lock,
  Video,
  Mic,
  Accessibility,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { useI18n } from "@/components/i18n-provider";
import { updateRoom } from "@/actions/admin";
import { cn } from "@/lib/utils";
import {
  getImageUploadPath,
  ROOM_IMAGE_MAX_BYTES,
  validateImageFile,
} from "@/lib/uploads/image-upload";

const AMENITIES = [
  { key: "WiFi", icon: Wifi },
  { key: "TV", icon: Monitor },
  { key: "Whiteboard", icon: Presentation },
  { key: "Phone", icon: Phone },
  { key: "Printer", icon: Printer },
  { key: "Coffee", icon: Coffee },
  { key: "Private", icon: Lock },
  { key: "Video Conferencing", icon: Video },
  { key: "Microphone", icon: Mic },
  { key: "Wheelchair Access", icon: Accessibility },
] as const;

const formSchema = z.object({
  name: z.string().min(2, { message: "admin.validationNameMin" }),
  capacity: z.coerce
    .number({ error: "admin.validationCapacityRequired" })
    .min(1, { message: "admin.validationCapacityMin" }),
});

type FormInput = z.input<typeof formSchema>;
type FormValues = z.output<typeof formSchema>;

interface EditRoomDialogProps {
  open: boolean;
  onClose: () => void;
  room: {
    id: string;
    name: string;
    capacity: number;
    amenities: string[] | null;
    image_url: string | null;
    floor_id: string;
  };
}

export function EditRoomDialog({ open, onClose, room }: EditRoomDialogProps) {
  const router = useRouter();
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    room.amenities || []
  );
  const [imageUrl, setImageUrl] = useState<string | null>(room.image_url);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const getErrorMessage = (message?: string) => (message ? t(message) : "");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: room.name,
      capacity: room.capacity,
    },
  });

  const uploadFile = useCallback(
    async (file: File) => {
      if (uploading) return;

      const validationError = validateImageFile(file, ROOM_IMAGE_MAX_BYTES);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      setUploading(true);
      try {
        const blob = await uploadBlob(
          getImageUploadPath("rooms", file.type),
          file,
          {
            access: "public",
            contentType: file.type,
            handleUploadUrl: "/api/upload",
          }
        );
        setImageUrl(blob.url);
        toast.success(t("admin.imageUploaded"));
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : t("admin.imageUploadFailed")
        );
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [uploading, t]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const toggleAmenity = (key: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  async function onSubmit(values: FormValues) {
    const result = await updateRoom(room.id, {
      name: values.name,
      capacity: values.capacity,
      amenities: selectedAmenities,
      image_url: imageUrl,
    });

    if (result.success) {
      toast.success(t("admin.roomUpdated"));
      onClose();
      router.refresh();
    } else {
      toast.error(result.message ? t(result.message) : t("errors.generic"));
    }
  }

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title={t("admin.editRoom")}
      description={t("admin.editRoomDescription")}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Image upload zone */}
        <div className="space-y-2">
          <Label>{t("admin.roomImage")}</Label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 cursor-pointer transition-colors",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-border/60 hover:border-primary/40 hover:bg-muted/30",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {imageUrl ? (
              <div className="relative w-full aspect-video rounded-md overflow-hidden">
                <Image
                  src={imageUrl}
                  alt={room.name}
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageUrl(null);
                  }}
                  className="absolute top-2 right-2 rounded-full bg-background/80 p-1 backdrop-blur-sm hover:bg-background"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : uploading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {t("admin.uploading")}
                </span>
              </>
            ) : (
              <>
                {dragOver ? (
                  <Upload className="h-8 w-8 text-primary" />
                ) : (
                  <ImagePlus className="h-8 w-8 text-muted-foreground/60" />
                )}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    {t("admin.dropImageHint")}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60 mt-1">
                    JPEG, PNG, WebP, AVIF &middot; max 5 MB
                  </p>
                </div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="edit-room-name">{t("admin.name")}</Label>
          <Input
            id="edit-room-name"
            placeholder={t("admin.placeholderRoomName")}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-red-500">
              {getErrorMessage(errors.name.message)}
            </p>
          )}
        </div>

        {/* Capacity */}
        <div className="space-y-2">
          <Label htmlFor="edit-room-capacity">{t("admin.capacity")}</Label>
          <Input
            id="edit-room-capacity"
            type="number"
            placeholder={t("admin.placeholderCapacity")}
            {...register("capacity")}
          />
          {errors.capacity && (
            <p className="text-xs text-red-500">
              {getErrorMessage(errors.capacity.message)}
            </p>
          )}
        </div>

        {/* Amenities */}
        <div className="space-y-2">
          <Label>{t("admin.amenities")}</Label>
          <div className="grid grid-cols-2 gap-2">
            {AMENITIES.map(({ key, icon: Icon }) => {
              const checked = selectedAmenities.includes(key);
              return (
                <label
                  key={key}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-xs cursor-pointer transition-colors select-none",
                    checked
                      ? "border-primary/40 bg-primary/5 text-foreground"
                      : "border-border/40 bg-background text-muted-foreground hover:border-border hover:bg-muted/30"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleAmenity(key)}
                    className="sr-only"
                  />
                  <div
                    className={cn(
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                      checked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/60"
                    )}
                  >
                    {checked && (
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{key}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end pt-2 gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {t("common.save")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
