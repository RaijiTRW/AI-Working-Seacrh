import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * GET /api/admin/support-chat/status
 * Получить статус Support Chat агента
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    const response = await fetch(`${BACKEND_URL}/api/admin/agents/status`, {
      method: "GET",
      headers: {
        "Authorization": authHeader || "",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Support Chat Status] Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch support chat status" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Извлекаем только support_chat статус
    const supportChatStatus = data.support_chat || {
      id: "support_chat",
      name: "AI-чат поддержки",
      description: "Чат поддержки в углу экрана",
      enabled: true,
    };

    return NextResponse.json(supportChatStatus, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[Support Chat Status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
