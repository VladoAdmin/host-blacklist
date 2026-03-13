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

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { guest_name, guest_email, guest_phone } = body as {
    guest_name?: string;
    guest_email?: string;
    guest_phone?: string;
  };

  if (!guest_name || typeof guest_name !== "string" || !guest_name.trim()) {
    return NextResponse.json(
      { error: "Guest name is required" },
      { status: 400 }
    );
  }

  const trimmedName = guest_name.trim();
  const trimmedEmail = guest_email?.trim() || null;
  const trimmedPhone = guest_phone?.trim() || null;

  // Call the check_duplicates RPC function
  const { data, error } = await supabase.rpc("check_duplicates", {
    p_name: trimmedName,
    p_email: trimmedEmail,
    p_phone: trimmedPhone,
  });

  if (error) {
    console.error("Duplicate check error:", error);
    // If the RPC doesn't exist yet, return empty array (graceful fallback)
    if (error.message?.includes("function") || error.code === "42883") {
      return NextResponse.json({ duplicates: [] });
    }
    return NextResponse.json(
      { error: "Duplicate check failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ duplicates: data || [] });
}
