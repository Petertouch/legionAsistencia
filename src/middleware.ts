import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Mock auth — skip real Supabase check until auth is implemented
  // The client-side AuthProvider handles role-based access
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
