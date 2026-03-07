import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check ownership
  const { data: msg } = await supabase
    .from("chat_messages")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!msg) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  if (msg.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    .update({
      message,
      edited: true,
      edited_at: new Date().toISOString(),
    })
    .eq("id", id)
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
    console.error("Chat update error:", error);
    return NextResponse.json(
      { error: "Failed to update message" },
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
    edited: data.edited,
    edited_at: data.edited_at,
    author_name: profile?.nickname || profile?.full_name || "Unknown",
    is_mine: true,
  });
}
