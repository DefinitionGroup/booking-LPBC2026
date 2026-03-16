import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // When Supabase strips the redirect path we lose the "next" param.
      // Detect a recent password-recovery flow and send the user to reset-password.
      if (next === "/" && data.user?.recovery_sent_at) {
        const recoveryAge = Date.now() - new Date(data.user.recovery_sent_at).getTime();
        if (recoveryAge < 3_600_000) {
          return NextResponse.redirect(`${origin}/login/reset-password`);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Could not exchange code — send back to login with error
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent("Could not verify link. Please try again.")}`);
}
