import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
    // If auth params land on the wrong path, forward them to the callback route.
    // Supabase can redirect to the site root with auth params attached.
    const code = request.nextUrl.searchParams.get("code");
    const tokenHash = request.nextUrl.searchParams.get("token_hash");

    if ((code || tokenHash) && !request.nextUrl.pathname.startsWith("/auth/callback")) {
        const url = request.nextUrl.clone();
        url.pathname = "/auth/callback";
        const next = request.nextUrl.searchParams.get("next");
        const type = request.nextUrl.searchParams.get("type");
        const flow = request.nextUrl.searchParams.get("flow");
        const params = new URLSearchParams();

        if (code) {
            params.set("code", code);
        }

        if (tokenHash) {
            params.set("token_hash", tokenHash);
        }

        if (type) {
            params.set("type", type);
        }

        if (next) {
            params.set("next", next);
        }

        if (flow) {
            params.set("flow", flow);
        }

        url.search = params.toString();
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
