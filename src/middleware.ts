import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /_next/static (static chunks, css)
     * 2. /_next/image (image optimization files)
     * 3. /favicon.ico (browser icon)
     * 4. /robots.txt (crawler blocking)
     * 5. Static assets under /images and /fonts
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|images/|fonts/).*)",
  ],
};

export function middleware(req: NextRequest) {
  const configuredPassword =
    process.env.SITE_PASSWORD?.trim() ||
    process.env.WP_SUPER_ADMIN?.trim() ||
    "";

  // No site password configured: open the dashboard for local development.
  if (!configuredPassword) {
    return NextResponse.next();
  }

  const isPasswordCorrect = (candidate?: string | null): boolean => {
    if (!candidate) return false;
    return candidate === configuredPassword;
  };

  // 1. Direct query parameter unlock (e.g. ?pass=david or ?key=david)
  const queryPass = req.nextUrl.searchParams.get("pass") || req.nextUrl.searchParams.get("key");
  if (isPasswordCorrect(queryPass)) {
    const cleanUrl = new URL(req.nextUrl.pathname, req.url);
    const response = NextResponse.redirect(cleanUrl);
    response.cookies.set("site_auth", configuredPassword, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
    return response;
  }

  // 2. Cookie session check
  const cookiePass = req.cookies.get("site_auth")?.value;
  if (isPasswordCorrect(cookiePass)) {
    return NextResponse.next();
  }

  // 3. Automation header check (e.g. x-admin-password)
  const adminHeader = req.headers.get("x-admin-password")?.trim();
  if (isPasswordCorrect(adminHeader)) {
    return NextResponse.next();
  }

  // 4. HTTP Basic Auth (.htaccess / .htpasswd standard)
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Basic ")) {
    const base64 = authHeader.substring(6).trim();
    try {
      const decoded = atob(base64);
      const colonIdx = decoded.indexOf(":");
      const password = colonIdx !== -1 ? decoded.slice(colonIdx + 1) : "";

      if (isPasswordCorrect(password)) {
        const response = NextResponse.next();
        response.cookies.set("site_auth", configuredPassword, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 30,
          path: "/",
        });
        return response;
      }
    } catch {
      // Invalid base64, fall through to 401 prompt
    }
  }

  // 5. Unauthenticated: trigger native browser login prompt (.htaccess style)
  return new NextResponse(
    "401 Unauthorized: Access to Atoyan Law Publisher is private. Please enter your credentials to continue.",
    {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Atoyan Law Publisher (Private)", charset="UTF-8"',
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    },
  );
}
