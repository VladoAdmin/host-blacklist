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

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, company_name, city, country, properties_count, nickname, avatar_url")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function PUT(request: Request) {
  const supabase = await createClient();

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

  // Validate full_name is required and non-empty
  const fullName =
    typeof body.full_name === "string" ? body.full_name.trim() : "";
  if (!fullName) {
    return NextResponse.json(
      { error: "Full name is required" },
      { status: 400 }
    );
  }

  // Validate nickname
  let nickname: string | null = null;
  if (typeof body.nickname === "string" && body.nickname.trim()) {
    nickname = body.nickname.trim();
    if (nickname.length > 30) {
      return NextResponse.json(
        { error: "Nickname must be 30 characters or less" },
        { status: 400 }
      );
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(nickname)) {
      return NextResponse.json(
        { error: "Nickname can only contain letters, numbers, _ and -" },
        { status: 400 }
      );
    }
    // Check uniqueness
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("nickname", nickname)
      .neq("id", user.id)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: "Nickname is already taken" },
        { status: 409 }
      );
    }
  }

  // Sanitize and validate properties_count
  const propertiesCount =
    typeof body.properties_count === "number" && body.properties_count >= 1
      ? Math.floor(body.properties_count)
      : 1;

  const updateData = {
    full_name: fullName,
    company_name:
      typeof body.company_name === "string"
        ? body.company_name.trim() || null
        : null,
    city: typeof body.city === "string" ? body.city.trim() || null : null,
    country:
      typeof body.country === "string" ? body.country.trim() || null : null,
    properties_count: propertiesCount,
    nickname,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .update(updateData)
    .eq("id", user.id)
    .select("id, full_name, company_name, city, country, properties_count, nickname, avatar_url")
    .single();

  if (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
