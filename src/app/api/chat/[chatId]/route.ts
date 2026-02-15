import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * DELETE /api/chat/[chatId]
 * Proxy to Python backend delete chat endpoint
 */
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ chatId: string }> }
) {
  try {
    const { chatId } = await context.params;
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");

    const response = await fetch(`${BACKEND_URL}/api/chat/${chatId}?user_id=${userId}`, {
      method: "DELETE",
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Delete Chat] Backend error:", response.status, errorText);
      return NextResponse.json({ error: "Failed to delete chat" }, { status: response.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Delete Chat] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
