import { NextRequest } from "next/server";
import { handleAdminImageUpload } from "@/lib/uploads/blob-storage";
import { BACKGROUND_IMAGE_MAX_BYTES } from "@/lib/uploads/image-upload";

export async function POST(request: NextRequest) {
  return handleAdminImageUpload(request, {
    prefix: "backgrounds",
    maximumSizeInBytes: BACKGROUND_IMAGE_MAX_BYTES,
  });
}
