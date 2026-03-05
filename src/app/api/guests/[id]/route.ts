import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  const masked = local.length > 1 ? local[0] + "***" : "***";
  return `${masked}@${domain}`;
}

function anonymizeReporter(profile: {
  full_name: string | null;
  city: string | null;
  country: string | null;
} | null): string {
  if (!profile) return "Anonymous host";
  if (profile.city) return `Host from ${profile.city}`;
  if (profile.country) return `Host from ${profile.country}`;
  if (profile.full_name) {
    const parts = profile.full_name.trim().split(/\s+/);
    const initials = parts.map((p) => p[0]?.toUpperCase()).join(".");
    return initials || "Anonymous host";
  }
  return "Anonymous host";
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch guest
  const { data: guest, error: guestError } = await supabase
    .from("guests")
    .select("id, full_name, email, phone, notes, reports_count, created_at")
    .eq("id", id)
    .single();

  if (guestError || !guest) {
    return NextResponse.json({ error: "Guest not found" }, { status: 404 });
  }

  // Fetch reports with reporter profile info
  const { data: reports, error: reportsError } = await supabase
    .from("reports")
    .select(
      "id, incident_type, incident_date, severity, description, property_name, platform, created_at, reporter_id"
    )
    .eq("guest_id", id)
    .order("created_at", { ascending: false });

  if (reportsError) {
    console.error("Reports fetch error:", reportsError);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }

  // Fetch reporter profiles
  const reporterIds = [
    ...new Set((reports || []).map((r) => r.reporter_id).filter(Boolean)),
  ];

  const profilesMap = new Map<
    string,
    { full_name: string | null; city: string | null; country: string | null }
  >();

  if (reporterIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, city, country")
      .in("id", reporterIds);

    if (profiles) {
      for (const p of profiles) {
        profilesMap.set(p.id, {
          full_name: p.full_name,
          city: p.city,
          country: p.country,
        });
      }
    }
  }

  // Build response with masked/anonymized data
  const maskedGuest = {
    id: guest.id,
    full_name: guest.full_name,
    email: maskEmail(guest.email),
    phone: guest.phone ? guest.phone.slice(0, 4) + "****" : null,
    reports_count: guest.reports_count,
    created_at: guest.created_at,
  };

  const enrichedReports = (reports || []).map((r) => ({
    id: r.id,
    incident_type: r.incident_type,
    incident_date: r.incident_date,
    severity: r.severity,
    description: r.description,
    property_name: r.property_name,
    platform: r.platform,
    created_at: r.created_at,
    reporter: anonymizeReporter(profilesMap.get(r.reporter_id) ?? null),
    reporter_id: r.reporter_id,
  }));

  return NextResponse.json({
    guest: maskedGuest,
    reports: enrichedReports,
  });
}
