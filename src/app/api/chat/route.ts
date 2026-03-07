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

  // Fetch top-level messages (no parent_id) with author info
  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select(`
      id,
      message,
      likes_count,
      created_at,
      user_id,
      parent_id,
      edited,
      edited_at,
      profiles!chat_messages_user_id_fkey (
        full_name,
        nickname
      )
    `)
    .is("parent_id", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Chat fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }

  const messageIds = (messages || []).map((m) => m.id);

  // Fetch replies for these messages
  let repliesMap: Record<string, typeof messages> = {};
  if (messageIds.length > 0) {
    const { data: replies } = await supabase
      .from("chat_messages")
      .select(`
        id,
        message,
        likes_count,
        created_at,
        user_id,
        parent_id,
        edited,
        edited_at,
        profiles!chat_messages_user_id_fkey (
          full_name,
          nickname
        )
      `)
      .in("parent_id", messageIds)
      .order("created_at", { ascending: true });

    if (replies) {
      for (const reply of replies) {
        const pid = reply.parent_id!;
        if (!repliesMap[pid]) repliesMap[pid] = [];
        repliesMap[pid].push(reply);
      }
    }
  }

  // Get all message IDs (including replies) for likes lookup
  const allReplyIds = Object.values(repliesMap).flat().map((r) => r.id);
  const allIds = [...messageIds, ...allReplyIds];

  // Get likes by current user
  let userLikes: string[] = [];
  if (allIds.length > 0) {
    const { data: likes } = await supabase
      .from("chat_likes")
      .select("message_id")
      .eq("user_id", user.id)
      .in("message_id", allIds);
    userLikes = (likes || []).map((l) => l.message_id);
  }

  type ProfileData = { full_name: string; nickname: string | null } | null;

  const formatMessage = (m: (typeof messages)[number]) => {
    const profile = m.profiles as unknown as ProfileData;
    return {
      id: m.id,
      message: m.message,
      likes_count: m.likes_count,
      created_at: m.created_at,
      user_id: m.user_id,
      parent_id: m.parent_id,
      edited: m.edited || false,
      edited_at: m.edited_at,
      author_name: profile?.nickname || profile?.full_name || "Unknown",
      is_liked_by_me: userLikes.includes(m.id),
      is_mine: m.user_id === user.id,
    };
  };

  const formatted = (messages || []).map((m) => ({
    ...formatMessage(m),
    replies: (repliesMap[m.id] || []).map(formatMessage),
  }));

  // Count only top-level messages for pagination
  const { count } = await supabase
    .from("chat_messages")
    .select("id", { count: "exact", head: true })
    .is("parent_id", null);

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

  // Optional parent_id for replies
  const parent_id = typeof body.parent_id === "string" ? body.parent_id : null;

  // If replying, verify parent exists and is a top-level message
  if (parent_id) {
    const { data: parent } = await supabase
      .from("chat_messages")
      .select("id, parent_id")
      .eq("id", parent_id)
      .single();

    if (!parent) {
      return NextResponse.json(
        { error: "Parent message not found" },
        { status: 404 }
      );
    }

    // Only allow 1 level of nesting
    if (parent.parent_id) {
      return NextResponse.json(
        { error: "Cannot reply to a reply" },
        { status: 400 }
      );
    }
  }

  const insertData: Record<string, unknown> = {
    user_id: user.id,
    message,
  };
  if (parent_id) {
    insertData.parent_id = parent_id;
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert(insertData)
    .select(`
      id,
      message,
      likes_count,
      created_at,
      user_id,
      parent_id,
      edited,
      edited_at,
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
    parent_id: data.parent_id,
    edited: data.edited || false,
    edited_at: data.edited_at,
    author_name: profile?.nickname || profile?.full_name || "Unknown",
    is_liked_by_me: false,
    is_mine: true,
    replies: [],
  });
}
