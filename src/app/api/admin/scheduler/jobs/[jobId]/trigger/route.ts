import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * POST /api/admin/scheduler/jobs/[jobId]/trigger
 * Proxy to Python backend trigger job endpoint
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const authHeader = req.headers.get("authorization");
    const { jobId } = await params;

    const response = await fetch(`${BACKEND_URL}/api/admin/scheduler/jobs/${jobId}/trigger`, {
      method: "POST",
      headers: {
        "Authorization": authHeader || "",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Scheduler Trigger] Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to trigger job" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[Scheduler Trigger] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
