import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { image: string } | undefined;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const base64Image = body?.image;
  if (!base64Image || typeof base64Image !== "string") {
    return NextResponse.json(
      { error: "No image provided" },
      { status: 400 }
    );
  }

  // Validate base64 (should start with data: or be raw base64)
  const imageUrl = base64Image.startsWith("data:")
    ? base64Image
    : `data:image/jpeg;base64,${base64Image}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are analyzing a booking platform screenshot (Airbnb, Booking.com, or similar). Extract all guest and reservation information visible in the screenshot.

Return a JSON object with these fields (use null for any field you cannot find):
{
  "guest_name": "Full name of the guest",
  "check_in": "Check-in date in YYYY-MM-DD format",
  "check_out": "Check-out date in YYYY-MM-DD format",
  "platform": "airbnb" | "booking" | "direct" | "other",
  "booking_id": "Booking/reservation ID if visible",
  "num_guests": number or null,
  "property_name": "Property/listing name if visible",
  "notes": "Any other relevant details (guest messages, special requests, etc.)"
}

Important:
- For platform, detect from the UI design: Airbnb has red/pink accents, Booking.com has blue
- Dates should be in YYYY-MM-DD format regardless of how they appear
- If the screenshot is not a booking platform, set all fields to null and add a note explaining why`,
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No response from OCR" },
        { status: 500 }
      );
    }

    const extracted = JSON.parse(content);
    return NextResponse.json({ data: extracted });
  } catch (err) {
    console.error("OCR error:", err);

    if (err instanceof OpenAI.APIError) {
      if (err.status === 429) {
        return NextResponse.json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
