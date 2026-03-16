import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
    // If an auth code lands on a page that isn't the callback, forward it there.
    // This handles Supabase stripping the path from the redirect URL,
    // sending the user to e.g. /?code=XXX instead of /auth/callback?code=XXX.
    const code = request.nextUrl.searchParams.get("code");
    if (code && !request.nextUrl.pathname.startsWith("/auth/callback")) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/callback";
        const next = request.nextUrl.searchParams.get("next");
        url.search = next
            ? `?code=${encodeURIComponent(code)}&next=${encodeURIComponent(next)}`
            : `?code=${encodeURIComponent(code)}`;
        return NextResponse.redirect(url);
    }

    return await updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
