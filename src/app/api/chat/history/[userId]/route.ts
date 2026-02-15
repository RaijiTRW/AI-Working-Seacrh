import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * GET /api/chat/history/[userId]
 * Proxy to Python backend get history endpoint
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const url = new URL(req.url);
    const chatId = url.searchParams.get("chat_id");
    const limit = url.searchParams.get("limit") || "20";

    let backendUrl = `${BACKEND_URL}/api/chat/history/${userId}?limit=${limit}`;
    if (chatId) {
      backendUrl += `&chat_id=${chatId}`;
    }

    const response = await fetch(backendUrl, { cache: "no-store" });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Get History] Backend error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to get history" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Get History] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
