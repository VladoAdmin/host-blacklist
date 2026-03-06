import { createClient } from "@/lib/supabase/server";
import { shareToFacebookGroup } from "@/lib/facebook";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/social/share
 *
 * Shares a report notification to configured social platforms (currently Facebook Group).
 * Requires authentication. Only public info is shared (incident type, severity, guest link).
 *
 * Body: { guestId: string, incidentType: string, severity: number }
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { guestId, incidentType, severity } = body as {
    guestId?: string;
    incidentType?: string;
    severity?: number;
  };

  if (!guestId || !incidentType || severity === undefined) {
    return NextResponse.json(
      { error: "guestId, incidentType, and severity are required" },
      { status: 400 }
    );
  }

  // Derive the public base URL from the request
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || "localhost:3000";
  const protocol = forwardedHost ? "https" : request.nextUrl.protocol.replace(":", "");
  const baseUrl = `${protocol}://${host}`;

  const result = await shareToFacebookGroup(
    {
      incidentType,
      severity: Number(severity),
      guestId,
    },
    baseUrl
  );

  if (!result.success) {
    // Log but don't fail the caller — sharing is best-effort
    console.error("[social/share] Facebook share failed:", result.error);
    return NextResponse.json(
      { shared: false, error: result.error },
      { status: 200 }
    );
  }

  return NextResponse.json({
    shared: !result.skipped,
    skipped: result.skipped ?? false,
    postId: result.postId ?? null,
  });
}
