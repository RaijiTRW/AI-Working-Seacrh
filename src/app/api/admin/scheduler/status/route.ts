import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * GET /api/admin/scheduler/status
 * Proxy to Python backend scheduler status endpoint
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    const response = await fetch(`${BACKEND_URL}/api/admin/scheduler/status`, {
      method: "GET",
      headers: {
        "Authorization": authHeader || "",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Scheduler Status] Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch scheduler status" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Scheduler Status] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
