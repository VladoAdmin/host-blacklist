import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/sk/dashboard";

  // Ensure next path has locale prefix
  const localizedNext = next.startsWith("/sk/") || next.startsWith("/en/")
    ? next
    : `/sk${next}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${localizedNext}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${localizedNext}`);
      } else {
        return NextResponse.redirect(`${origin}${localizedNext}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/sk/login?error=auth_callback_failed`);
}
