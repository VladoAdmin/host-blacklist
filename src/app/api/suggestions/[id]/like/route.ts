import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: suggestionId } = await params;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if suggestion exists
  const { data: suggestion } = await supabase
    .from("suggestions")
    .select("id, likes_count")
    .eq("id", suggestionId)
    .single();

  if (!suggestion) {
    return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
  }

  // Check if already liked
  const { data: existingLike } = await supabase
    .from("suggestion_likes")
    .select("id")
    .eq("suggestion_id", suggestionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingLike) {
    // Unlike
    await supabase
      .from("suggestion_likes")
      .delete()
      .eq("id", existingLike.id);

    await supabase
      .from("suggestions")
      .update({ likes_count: Math.max(0, (suggestion.likes_count || 0) - 1) })
      .eq("id", suggestionId);

    return NextResponse.json({
      liked: false,
      likes_count: Math.max(0, (suggestion.likes_count || 0) - 1),
    });
  } else {
    // Like
    const { error: likeError } = await supabase
      .from("suggestion_likes")
      .insert({ suggestion_id: suggestionId, user_id: user.id });

    if (likeError) {
      console.error("Suggestion like insert error:", likeError);
      return NextResponse.json(
        { error: "Failed to like suggestion" },
        { status: 500 }
      );
    }

    await supabase
      .from("suggestions")
      .update({ likes_count: (suggestion.likes_count || 0) + 1 })
      .eq("id", suggestionId);

    return NextResponse.json({
      liked: true,
      likes_count: (suggestion.likes_count || 0) + 1,
    });
  }
}
