import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const sort = searchParams.get("sort") || "newest";
  const offset = parseInt(searchParams.get("offset") || "0");
  const limit = 20;

  let query = supabase
    .from("suggestions")
    .select(`
      id,
      title,
      description,
      likes_count,
      status,
      created_at,
      user_id,
      profiles!suggestions_user_id_fkey (
        full_name,
        nickname
      )
    `);

  if (sort === "popular") {
    query = query.order("likes_count", { ascending: false }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data: suggestions, error } = await query.range(offset, offset + limit - 1);

  if (error) {
    console.error("Suggestions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }

  // Get likes by current user
  const suggestionIds = (suggestions || []).map((s) => s.id);
  let userLikes: string[] = [];
  if (suggestionIds.length > 0) {
    const { data: likes } = await supabase
      .from("suggestion_likes")
      .select("suggestion_id")
      .eq("user_id", user.id)
      .in("suggestion_id", suggestionIds);
    userLikes = (likes || []).map((l) => l.suggestion_id);
  }

  const formatted = (suggestions || []).map((s) => {
    const profile = s.profiles as unknown as { full_name: string; nickname: string | null } | null;
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      likes_count: s.likes_count,
      status: s.status,
      created_at: s.created_at,
      user_id: s.user_id,
      author_name: profile?.nickname || profile?.full_name || "Unknown",
      is_liked_by_me: userLikes.includes(s.id),
      is_mine: s.user_id === user.id,
    };
  });

  const { count } = await supabase
    .from("suggestions")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({
    suggestions: formatted,
    has_more: (count || 0) > offset + limit,
  });
}

export async function POST(request: Request) {
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

  const title =
    typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json(
      { error: "Title is required" },
      { status: 400 }
    );
  }
  if (title.length > 100) {
    return NextResponse.json(
      { error: "Title must be 100 characters or less" },
      { status: 400 }
    );
  }

  const description =
    typeof body.description === "string" ? body.description.trim() : null;
  if (description && description.length > 1000) {
    return NextResponse.json(
      { error: "Description must be 1000 characters or less" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("suggestions")
    .insert({
      user_id: user.id,
      title,
      description: description || null,
    })
    .select(`
      id,
      title,
      description,
      likes_count,
      status,
      created_at,
      user_id,
      profiles!suggestions_user_id_fkey (
        full_name,
        nickname
      )
    `)
    .single();

  if (error) {
    console.error("Suggestion insert error:", error);
    return NextResponse.json(
      { error: "Failed to create suggestion" },
      { status: 500 }
    );
  }

  const profile = data.profiles as unknown as { full_name: string; nickname: string | null } | null;
  return NextResponse.json({
    id: data.id,
    title: data.title,
    description: data.description,
    likes_count: data.likes_count,
    status: data.status,
    created_at: data.created_at,
    user_id: data.user_id,
    author_name: profile?.nickname || profile?.full_name || "Unknown",
    is_liked_by_me: false,
    is_mine: true,
  });
}
