import { NextRequest } from "next/server";
import { handleAdminImageUpload } from "@/lib/uploads/blob-storage";
import { ROOM_IMAGE_MAX_BYTES } from "@/lib/uploads/image-upload";

export async function POST(request: NextRequest) {
  return handleAdminImageUpload(request, {
    prefix: "rooms",
    maximumSizeInBytes: ROOM_IMAGE_MAX_BYTES,
  });
}
