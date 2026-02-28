import { NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

export async function GET(request) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL("/vote", request.url));
}
