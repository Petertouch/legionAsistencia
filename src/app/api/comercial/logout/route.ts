import { NextResponse } from "next/server";
import { COMERCIAL_COOKIE } from "@/lib/comercial-auth";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COMERCIAL_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
