import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user's recent reports with guest info (limit 10)
  const { data: myReports, error: reportsError } = await supabase
    .from("reports")
    .select(
      "id, guest_id, incident_type, incident_date, severity, description, property_name, platform, created_at, guests(id, full_name)"
    )
    .eq("reporter_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (reportsError) {
    console.error("Dashboard reports error:", reportsError);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }

  // Count total guests in DB
  const { count: totalGuests, error: guestsCountError } = await supabase
    .from("guests")
    .select("*", { count: "exact", head: true });

  if (guestsCountError) {
    console.error("Dashboard guests count error:", guestsCountError);
  }

  // Count user's total reports
  const { count: myReportsCount, error: myCountError } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("reporter_id", user.id);

  if (myCountError) {
    console.error("Dashboard my reports count error:", myCountError);
  }

  // Flatten the guest join for easier consumption
  const reports = (myReports || []).map((r) => ({
    id: r.id,
    guest_id: r.guest_id,
    guest_name:
      (r.guests as unknown as { id: string; full_name: string })?.full_name ||
      "Unknown",
    incident_type: r.incident_type,
    incident_date: r.incident_date,
    severity: r.severity,
    description: r.description,
    property_name: r.property_name,
    platform: r.platform,
    created_at: r.created_at,
  }));

  return NextResponse.json({
    my_reports: reports,
    stats: {
      total_guests: totalGuests ?? 0,
      my_reports_count: myReportsCount ?? 0,
    },
  });
}
