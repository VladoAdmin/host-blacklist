import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const VALID_INCIDENT_TYPES = [
  "damage",
  "theft",
  "noise",
  "fraud",
  "no_show",
  "other",
] as const;

const VALID_PLATFORMS = ["Airbnb", "Booking", "Direct", "Other"] as const;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

  const {
    guest_name,
    guest_email,
    guest_phone,
    incident_type,
    incident_date,
    severity,
    description,
    property_name,
    platform,
  } = body as {
    guest_name?: string;
    guest_email?: string;
    guest_phone?: string;
    incident_type?: string;
    incident_date?: string;
    severity?: number;
    description?: string;
    property_name?: string;
    platform?: string;
  };

  // Validate required fields
  const errors: string[] = [];

  if (!guest_name || typeof guest_name !== "string" || !guest_name.trim()) {
    errors.push("Guest name is required");
  }

  if (
    !incident_type ||
    !VALID_INCIDENT_TYPES.includes(
      incident_type as (typeof VALID_INCIDENT_TYPES)[number]
    )
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

  // Validate optional fields
  if (guest_email && !isValidEmail(guest_email)) {
    errors.push("Invalid email format");
  }

  if (severity !== undefined && severity !== null) {
    const sev = Number(severity);
    if (!Number.isInteger(sev) || sev < 1 || sev > 5) {
      errors.push("Severity must be between 1 and 5");
    }
  }

  if (
    platform &&
    !VALID_PLATFORMS.includes(platform as (typeof VALID_PLATFORMS)[number])
  ) {
    errors.push("Invalid platform");
  }

  if (errors.length > 0) {
    return NextResponse.json({ error: errors.join(". ") }, { status: 400 });
  }

  // Guest upsert logic
  let guestId: string;

  const trimmedEmail = guest_email?.trim() || null;
  const trimmedName = guest_name!.trim();

  if (trimmedEmail) {
    // Check if guest with this email already exists
    const { data: existingGuest } = await supabase
      .from("guests")
      .select("id")
      .eq("email", trimmedEmail)
      .single();

    if (existingGuest) {
      guestId = existingGuest.id;
    } else {
      // Create new guest with email
      const { data: newGuest, error: guestError } = await supabase
        .from("guests")
        .insert({
          full_name: trimmedName,
          email: trimmedEmail,
          phone: guest_phone?.trim() || null,
        })
        .select("id")
        .single();

      if (guestError || !newGuest) {
        console.error("Guest create error:", guestError);
        return NextResponse.json(
          { error: "Failed to create guest record" },
          { status: 500 }
        );
      }
      guestId = newGuest.id;
    }
  } else {
    // No email provided - always create new guest
    const { data: newGuest, error: guestError } = await supabase
      .from("guests")
      .insert({
        full_name: trimmedName,
        phone: guest_phone?.trim() || null,
      })
      .select("id")
      .single();

    if (guestError || !newGuest) {
      console.error("Guest create error:", guestError);
      return NextResponse.json(
        { error: "Failed to create guest record" },
        { status: 500 }
      );
    }
    guestId = newGuest.id;
  }

  // Create report
  const { data: report, error: reportError } = await supabase
    .from("reports")
    .insert({
      guest_id: guestId,
      reporter_id: user.id,
      incident_type: incident_type!,
      incident_date: incident_date || null,
      severity: severity ? Number(severity) : 3,
      description: description!.trim(),
      property_name: property_name?.trim() || null,
      platform: platform || null,
    })
    .select("id")
    .single();

  if (reportError) {
    // Handle unique constraint violation (guest_id + reporter_id)
    if (
      reportError.code === "23505" ||
      reportError.message?.includes("unique") ||
      reportError.message?.includes("duplicate")
    ) {
      return NextResponse.json(
        { error: "You already reported this guest" },
        { status: 409 }
      );
    }
    console.error("Report create error:", reportError);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }

  // Increment reports_count on guest
  const { error: updateError } = await supabase.rpc("increment_counter", {
    row_id: guestId,
    table_name: "guests",
    column_name: "reports_count",
  });

  // If RPC doesn't exist, fallback to manual update
  if (updateError) {
    // Fallback: fetch current count and update
    const { data: currentGuest } = await supabase
      .from("guests")
      .select("reports_count")
      .eq("id", guestId)
      .single();

    if (currentGuest) {
      await supabase
        .from("guests")
        .update({ reports_count: (currentGuest.reports_count || 0) + 1 })
        .eq("id", guestId);
    }
  }

  return NextResponse.json(
    { guest_id: guestId, report_id: report!.id },
    { status: 201 }
  );
}
