import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Check for mock session cookie first
  const mockSessionCookie = request.cookies.get("readspace_mock_session")?.value;
  let isAuthenticated = false;
  let role = "student";

  if (mockSessionCookie) {
    try {
      const mockSession = JSON.parse(decodeURIComponent(mockSessionCookie));
      if (mockSession && mockSession.id) {
        isAuthenticated = true;
        role = mockSession.role || "student";
      }
    } catch (e) {
      console.error("Error parsing mock session cookie:", e);
    }
  }

  // 2. If not authenticated via mock, check real Supabase auth
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured =
    supabaseUrl &&
    supabaseUrl !== "https://placeholder.supabase.co" &&
    supabaseAnonKey &&
    supabaseAnonKey !== "placeholder-anon-key";

  if (!isAuthenticated && isSupabaseConfigured) {
    try {
      // Create Supabase client using request cookies (proxy-compatible)
      const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // In proxy we can't set cookies on the request,
            // but we need this for the client to initialize
          },
        },
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        isAuthenticated = true;
        role = request.cookies.get("readspace_user_role")?.value || "student";
      }
    } catch (e) {
      console.error("Error checking Supabase auth in proxy:", e);
    }
  }

  const isLoginPage = path === "/login";

  // 3. Routing logic
  if (!isAuthenticated) {
    // If not authenticated and not on login page, redirect to login
    if (!isLoginPage) {
      const redirectUrl = new URL("/login", request.url);
      redirectUrl.searchParams.set("next", path);
      return NextResponse.redirect(redirectUrl);
    }
  } else {
    // If authenticated
    if (isLoginPage) {
      // Redirect logged-in users away from login
      const destination = role === "admin" ? "/admin" : "/";
      return NextResponse.redirect(new URL(destination, request.url));
    }

    // Protect admin routes
    if (path.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - logo (public logo assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|logo).*)",
  ],
};

