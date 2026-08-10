import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    response = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (user && !request.nextUrl.pathname.startsWith("/auth")) {
        const { data: profile } = await supabase
            .from("profiles")
            .select("status")
            .eq("auth_user_id", user.id)
            .single();

        if (!profile || profile.status !== "active") {
            await supabase.auth.signOut();
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            url.search = "?error=account_inactive";
            const redirectResponse = NextResponse.redirect(url);
            response.cookies.getAll().forEach((cookie) => {
                redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
            });
            return redirectResponse;
        }
    }

    // Protected Routes Logic
    if (
        !user &&
        !request.nextUrl.pathname.startsWith("/login") &&
        !request.nextUrl.pathname.startsWith("/auth") &&
        !request.nextUrl.pathname.startsWith("/_next") && // Next.js internals
        !request.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg)$/) // Static files
    ) {
        const url = request.nextUrl.clone();
        url.pathname = "/login";
        return NextResponse.redirect(url);
    }

    // Redirect logged-in users away from login page (but not password reset)
    if (user && request.nextUrl.pathname.startsWith("/login") && !request.nextUrl.pathname.startsWith("/login/reset-password")) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
    }

    return response;
}
