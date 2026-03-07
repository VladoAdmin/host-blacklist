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
  const offset = parseInt(searchParams.get("offset") || "0");
  const limit = 20;

  // Fetch messages with author info
  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select(`
      id,
      message,
      likes_count,
      created_at,
      user_id,
      profiles!chat_messages_user_id_fkey (
        full_name,
        nickname
      )
    `)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Chat fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }

  // Get likes by current user for these messages
  const messageIds = (messages || []).map((m) => m.id);
  let userLikes: string[] = [];
  if (messageIds.length > 0) {
    const { data: likes } = await supabase
      .from("chat_likes")
      .select("message_id")
      .eq("user_id", user.id)
      .in("message_id", messageIds);
    userLikes = (likes || []).map((l) => l.message_id);
  }

  const formatted = (messages || []).map((m) => {
    const profile = m.profiles as unknown as { full_name: string; nickname: string | null } | null;
    return {
      id: m.id,
      message: m.message,
      likes_count: m.likes_count,
      created_at: m.created_at,
      user_id: m.user_id,
      author_name: profile?.nickname || profile?.full_name || "Unknown",
      is_liked_by_me: userLikes.includes(m.id),
      is_mine: m.user_id === user.id,
    };
  });

  // Check if there are more messages
  const { count } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({
    messages: formatted,
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

  const message =
    typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json(
      { error: "Message is required" },
      { status: 400 }
    );
  }
  if (message.length > 500) {
    return NextResponse.json(
      { error: "Message must be 500 characters or less" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      user_id: user.id,
      message,
    })
    .select(`
      id,
      message,
      likes_count,
      created_at,
      user_id,
      profiles!chat_messages_user_id_fkey (
        full_name,
        nickname
      )
    `)
    .single();

  if (error) {
    console.error("Chat insert error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }

  const profile = data.profiles as unknown as { full_name: string; nickname: string | null } | null;
  return NextResponse.json({
    id: data.id,
    message: data.message,
    likes_count: data.likes_count,
    created_at: data.created_at,
    user_id: data.user_id,
    author_name: profile?.nickname || profile?.full_name || "Unknown",
    is_liked_by_me: false,
    is_mine: true,
  });
}
