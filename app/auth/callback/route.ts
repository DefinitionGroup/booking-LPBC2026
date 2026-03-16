import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function getSafeRedirectPath(next: string | null, fallback = "/") {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }

  return next;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const flow = searchParams.get("flow");
  const next = getSafeRedirectPath(searchParams.get("next"));

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const destination = flow === "recovery" ? "/login/reset-password" : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      const destination = flow === "recovery" || type === "recovery" ? "/login/reset-password" : next;
      return NextResponse.redirect(`${origin}${destination}`);
    }
  }

  // Could not exchange code — send back to login with error
  return NextResponse.redirect(
    `${origin}/login/forgot-password?error=${encodeURIComponent("Could not verify link. Please request a new password reset email.")}`
  );
}
