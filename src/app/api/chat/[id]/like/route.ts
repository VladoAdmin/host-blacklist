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
    .select("id, likes_count")
    .eq("id", messageId)
    .single();

  if (!msg) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  // Check if already liked
  const { data: existingLike } = await supabase
    .from("chat_likes")
    .select("id")
    .eq("message_id", messageId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingLike) {
    // Unlike
    await supabase
      .from("chat_likes")
      .delete()
      .eq("id", existingLike.id);

    // Decrement likes_count
    await supabase
      .from("chat_messages")
      .update({ likes_count: Math.max(0, (msg.likes_count || 0) - 1) })
      .eq("id", messageId);

    return NextResponse.json({
      liked: false,
      likes_count: Math.max(0, (msg.likes_count || 0) - 1),
    });
  } else {
    // Like
    const { error: likeError } = await supabase
      .from("chat_likes")
      .insert({ message_id: messageId, user_id: user.id });

    if (likeError) {
      console.error("Like insert error:", likeError);
      return NextResponse.json(
        { error: "Failed to like message" },
        { status: 500 }
      );
    }

    // Increment likes_count
    await supabase
      .from("chat_messages")
      .update({ likes_count: (msg.likes_count || 0) + 1 })
      .eq("id", messageId);

    return NextResponse.json({
      liked: true,
      likes_count: (msg.likes_count || 0) + 1,
    });
  }
}
