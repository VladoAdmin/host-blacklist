import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ guests: [] });
  }

  // Call Supabase RPC search_guests (TASK-006)
  const { data, error } = await supabase.rpc("search_guests", {
    query,
  });

  if (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }

  // The RPC returns id, full_name, email, similarity_score
  // We need reports_count from the guests table for the cards
  const guestIds = (data || []).map((g: { id: string }) => g.id);

  let guestsWithReports = data || [];

  if (guestIds.length > 0) {
    const { data: guestDetails } = await supabase
      .from("guests")
      .select("id, reports_count")
      .in("id", guestIds);

    const reportsMap = new Map(
      (guestDetails || []).map((g: { id: string; reports_count: number }) => [
        g.id,
        g.reports_count,
      ])
    );

    guestsWithReports = (data || []).map(
      (g: { id: string; full_name: string; email: string; similarity_score: number }) => ({
        id: g.id,
        full_name: g.full_name,
        email: g.email,
        similarity_score: g.similarity_score,
        reports_count: reportsMap.get(g.id) ?? 0,
      })
    );
  }

  return NextResponse.json({ guests: guestsWithReports });
}
