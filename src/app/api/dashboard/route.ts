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

  // --- Extended stats (TASK-106) ---

  const now = new Date();

  // Last global report (most recent report across all users)
  const { data: lastGlobalReportData } = await supabase
    .from("reports")
    .select(
      "id, guest_id, incident_type, incident_date, severity, description, property_name, platform, created_at, reporter_id, guests(id, full_name), profiles:reporter_id(full_name)"
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Reports today
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);
  const { count: reportsToday } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString());

  // Reports this week (Monday-based)
  const weekStart = new Date(now);
  const dayOfWeek = weekStart.getUTCDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setUTCDate(weekStart.getUTCDate() - mondayOffset);
  weekStart.setUTCHours(0, 0, 0, 0);
  const { count: reportsThisWeek } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .gte("created_at", weekStart.toISOString());

  // Reports this month
  const monthStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const { count: reportsThisMonth } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .gte("created_at", monthStart.toISOString());

  // Reports this year
  const yearStart = new Date(now.getUTCFullYear(), 0, 1);
  const { count: reportsThisYear } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .gte("created_at", yearStart.toISOString());

  // Top 5 reporters — join reports with profiles
  const { data: topReportersRaw } = await supabase
    .from("reports")
    .select("reporter_id, profiles:reporter_id(full_name)");

  // Aggregate in JS since Supabase JS client doesn't support GROUP BY
  const reporterCounts: Record<string, { full_name: string; count: number }> = {};
  if (topReportersRaw) {
    for (const r of topReportersRaw) {
      const rid = r.reporter_id;
      const name = (r.profiles as unknown as { full_name: string })?.full_name || "Unknown";
      if (!reporterCounts[rid]) {
        reporterCounts[rid] = { full_name: name, count: 0 };
      }
      reporterCounts[rid].count++;
    }
  }
  const topReporters = Object.entries(reporterCounts)
    .map(([reporter_id, data]) => ({
      reporter_id,
      full_name: data.full_name,
      report_count: data.count,
    }))
    .sort((a, b) => b.report_count - a.report_count)
    .slice(0, 5);

  // Trend data — reports per day for the last 30 days
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  const { data: trendReportsRaw } = await supabase
    .from("reports")
    .select("created_at")
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: true });

  // Build 30-day date map
  const trendMap: Record<string, number> = {};
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().split("T")[0];
    trendMap[key] = 0;
  }
  if (trendReportsRaw) {
    for (const r of trendReportsRaw) {
      const key = new Date(r.created_at).toISOString().split("T")[0];
      if (trendMap[key] !== undefined) {
        trendMap[key]++;
      }
    }
  }
  const trendData = Object.entries(trendMap).map(([date, count]) => ({
    date,
    count,
  }));

  // --- End extended stats ---

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

  // Format last global report
  let lastGlobalReport = null;
  if (lastGlobalReportData) {
    lastGlobalReport = {
      id: lastGlobalReportData.id,
      guest_id: lastGlobalReportData.guest_id,
      guest_name:
        (lastGlobalReportData.guests as unknown as { id: string; full_name: string })?.full_name ||
        "Unknown",
      reporter_name:
        (lastGlobalReportData.profiles as unknown as { full_name: string })?.full_name ||
        "Unknown",
      incident_type: lastGlobalReportData.incident_type,
      incident_date: lastGlobalReportData.incident_date,
      severity: lastGlobalReportData.severity,
      description: lastGlobalReportData.description,
      property_name: lastGlobalReportData.property_name,
      platform: lastGlobalReportData.platform,
      created_at: lastGlobalReportData.created_at,
    };
  }

  return NextResponse.json({
    my_reports: reports,
    stats: {
      total_guests: totalGuests ?? 0,
      my_reports_count: myReportsCount ?? 0,
      reports_today: reportsToday ?? 0,
      reports_this_week: reportsThisWeek ?? 0,
      reports_this_month: reportsThisMonth ?? 0,
      reports_this_year: reportsThisYear ?? 0,
    },
    last_global_report: lastGlobalReport,
    top_reporters: topReporters,
    trend_data: trendData,
  });
}
