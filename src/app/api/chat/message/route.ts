import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * POST /api/chat/message
 * Proxy to Python backend chat message endpoint
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const response = await fetch(`${BACKEND_URL}/api/chat/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Chat Message] Backend error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to send message" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Chat Message] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
