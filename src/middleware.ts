import { NextRequest, NextResponse } from "next/server";
import { allowedMutation } from "./lib/request-security.mjs";

export function middleware(request: NextRequest) {
  if (!allowedMutation(request)) {
    return NextResponse.json({ error: "Origem da solicitação inválida" }, { status: 403 });
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
export const config = { matcher: ["/api/:path*"] };
