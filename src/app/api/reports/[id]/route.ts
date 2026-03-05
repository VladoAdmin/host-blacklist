import { createClient } from "@/lib/supabase/server";
import { VALID_INCIDENT_TYPES, VALID_PLATFORMS } from "@/lib/constants";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: report, error } = await supabase
    .from("reports")
    .select(
      "id, guest_id, reporter_id, incident_type, incident_date, severity, description, property_name, platform, created_at, updated_at"
    )
    .eq("id", id)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (report.reporter_id !== user.id) {
    return NextResponse.json(
      { error: "You don't have permission to access this report" },
      { status: 403 }
    );
  }

  // Fetch guest info
  const { data: guest } = await supabase
    .from("guests")
    .select("full_name, email")
    .eq("id", report.guest_id)
    .single();

  return NextResponse.json({
    report,
    guest: guest || { full_name: "Unknown", email: null },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch existing report and check ownership
  const { data: existing, error: fetchError } = await supabase
    .from("reports")
    .select("id, reporter_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (existing.reporter_id !== user.id) {
    return NextResponse.json(
      { error: "You don't have permission to edit this report" },
      { status: 403 }
    );
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

  const { incident_type, incident_date, severity, description, property_name, platform } =
    body as {
      incident_type?: string;
      incident_date?: string;
      severity?: number;
      description?: string;
      property_name?: string;
      platform?: string;
    };

  // Validate
  const errors: string[] = [];

  if (
    !incident_type ||
    !VALID_INCIDENT_TYPES.includes(incident_type)
  ) {
    errors.push("Valid incident type is required");
  }

  if (
    !description ||
    typeof description !== "string" ||
    description.trim().length < 10
  ) {
    errors.push("Description is required (minimum 10 characters)");
  }

  if (severity !== undefined && severity !== null) {
    const sev = Number(severity);
    if (!Number.isInteger(sev) || sev < 1 || sev > 5) {
      errors.push("Severity must be between 1 and 5");
    }
  }

  if (
    platform &&
    !VALID_PLATFORMS.includes(platform)
  ) {
    errors.push("Invalid platform");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(". ") }, { status: 400 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("reports")
    .update({
      incident_type: incident_type!,
      incident_date: incident_date || null,
      severity: severity ? Number(severity) : 3,
      description: description!.trim(),
      property_name: property_name?.trim() || null,
      platform: platform || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("Report update error:", updateError);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }

  return NextResponse.json({ report: updated });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch existing report and check ownership
  const { data: existing, error: fetchError } = await supabase
    .from("reports")
    .select("id, reporter_id, guest_id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (existing.reporter_id !== user.id) {
    return NextResponse.json(
      { error: "You don't have permission to delete this report" },
      { status: 403 }
    );
  }

  // Delete report
  const { error: deleteError } = await supabase
    .from("reports")
    .delete()
    .eq("id", id);

  if (deleteError) {
    console.error("Report delete error:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }

  // Decrement guests.reports_count
  const { data: currentGuest } = await supabase
    .from("guests")
    .select("reports_count")
    .eq("id", existing.guest_id)
    .single();

  if (currentGuest) {
    const newCount = Math.max((currentGuest.reports_count || 1) - 1, 0);
    await supabase
      .from("guests")
      .update({ reports_count: newCount })
      .eq("id", existing.guest_id);
  }

  return NextResponse.json({ success: true });
}
