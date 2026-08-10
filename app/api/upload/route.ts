import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import path from "path";
import { writeFile, mkdir } from "fs/promises";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  // Auth check
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

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Allowed: JPEG, PNG, WebP, AVIF" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Maximum 5 MB" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const ext = path.extname(file.name) || ".jpg";
  const safeName = `${crypto.randomUUID()}${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "rooms");

  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, safeName), buffer);

  return NextResponse.json({ url: `/uploads/rooms/${safeName}` });
}
