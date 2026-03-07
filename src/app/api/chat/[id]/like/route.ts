import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: messageId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if message exists
  const { data: msg } = await supabase
    .from("chat_messages")
    .select("id")
    .eq("id", messageId)
    .single();

  if (!msg) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  // Use RPC function for atomic toggle
  const { data, error } = await supabase.rpc("toggle_chat_like", {
    p_message_id: messageId,
  });

  if (error) {
    console.error("Chat like RPC error:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    liked: data.liked,
    likes_count: data.likes_count,
  });
}
