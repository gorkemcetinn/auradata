import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Korunan rotalar — bu sayfalara girişsiz erişim olmaz
const PROTECTED = ["/canvas", "/dashboard"];
// Giriş yapılmışken görünmemesi gereken rotalar
const AUTH_ONLY = ["/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Supabase SSR client (cookie tabanlı, middleware içinde çalışır)
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Oturumu kontrol et (getUser > getSession — daha güvenli)
  const { data: { user } } = await supabase.auth.getUser();

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthOnly  = AUTH_ONLY.some((p) => pathname.startsWith(p));

  // Giriş yapılmamış + korunan sayfa → login'e yönlendir
  if (!user && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname); // giriş sonrası geri dön
    return NextResponse.redirect(loginUrl);
  }

  // Giriş yapılmış + login sayfası → dashboard'a yönlendir
  if (user && isAuthOnly) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  // Statik dosyalar ve API rotalarını atlat
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};