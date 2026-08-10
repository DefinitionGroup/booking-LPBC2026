import "server-only";

import { del } from "@vercel/blob";
import {
  handleUpload,
  type HandleUploadBody,
} from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  IMAGE_CONTENT_TYPES,
  type ImageUploadPrefix,
} from "@/lib/uploads/image-upload";

interface AdminImageUploadConfig {
  maximumSizeInBytes: number;
  prefix: ImageUploadPrefix;
}

function isValidUploadPath(pathname: string, prefix: ImageUploadPrefix) {
  return new RegExp(`^${prefix}/image\\.(?:jpg|png|webp|avif)$`).test(pathname);
}

export async function handleAdminImageUpload(
  request: NextRequest,
  config: AdminImageUploadConfig
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile || profile.role !== "admin" || profile.status !== "active") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image storage is not configured" },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname) => {
        if (!isValidUploadPath(pathname, config.prefix)) {
          throw new Error("Invalid upload path");
        }

        return {
          allowedContentTypes: [...IMAGE_CONTENT_TYPES],
          maximumSizeInBytes: config.maximumSizeInBytes,
          addRandomSuffix: true,
          allowOverwrite: false,
        };
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to authorize Vercel Blob upload", error);
    return NextResponse.json(
      { error: "Upload authorization failed" },
      { status: 400 }
    );
  }
}

export function isManagedPublicBlobUrl(value: string | null | undefined) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

export async function deleteManagedBlob(value: string | null | undefined) {
  if (!process.env.BLOB_READ_WRITE_TOKEN || !isManagedPublicBlobUrl(value)) {
    return;
  }

  try {
    await del(value as string);
  } catch (error) {
    // The database update is authoritative. A failed best-effort cleanup must
    // not roll back an otherwise successful admin action.
    console.error("Failed to delete replaced Vercel Blob", error);
  }
}
