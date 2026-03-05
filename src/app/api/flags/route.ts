import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse body
  let body: { report_id?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { report_id, reason } = body;

  // Validate report_id
  if (!report_id || typeof report_id !== "string") {
    return NextResponse.json(
      { error: "report_id is required" },
      { status: 400 }
    );
  }

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(report_id)) {
    return NextResponse.json(
      { error: "report_id must be a valid UUID" },
      { status: 400 }
    );
  }

  // Validate reason
  if (!reason || typeof reason !== "string" || reason.trim().length < 10) {
    return NextResponse.json(
      { error: "Reason is required (minimum 10 characters)" },
      { status: 400 }
    );
  }

  // Check report exists and get reporter_id
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .select("id, reporter_id")
    .eq("id", report_id)
    .single();

  if (reportError || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Cannot flag own report
  if (report.reporter_id === user.id) {
    return NextResponse.json(
      { error: "You cannot flag your own report" },
      { status: 403 }
    );
  }

  // Insert flag
  const { data: flag, error: insertError } = await supabase
    .from("flags")
    .insert({
      report_id,
      flagger_id: user.id,
      reason: reason.trim(),
    })
    .select("id")
    .single();

  if (insertError) {
    // Handle unique constraint violation
    if (
      insertError.code === "23505" ||
      insertError.message?.includes("unique") ||
      insertError.message?.includes("duplicate")
    ) {
      return NextResponse.json(
        { error: "You already flagged this report" },
        { status: 409 }
      );
    }
    console.error("Flag insert error:", insertError);
    return NextResponse.json(
      { error: "Failed to create flag" },
      { status: 500 }
    );
  }

  return NextResponse.json({ flag_id: flag.id }, { status: 201 });
}
