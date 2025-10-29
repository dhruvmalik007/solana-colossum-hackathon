import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const enforce = process.env.ENFORCE_HTTPS === "1";
  if (!enforce) return NextResponse.next();

  const proto = req.headers.get("x-forwarded-proto");
  if (proto && proto !== "https") {
    const url = new URL(req.url);
    url.protocol = "https:";
    return NextResponse.redirect(url, 307);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
