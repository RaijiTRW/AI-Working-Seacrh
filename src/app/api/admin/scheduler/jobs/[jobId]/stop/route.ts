import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * POST /api/admin/scheduler/jobs/[jobId]/stop
 * Proxy to Python backend stop job endpoint
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const authHeader = req.headers.get("authorization");
    const { jobId } = await params;

    const response = await fetch(`${BACKEND_URL}/api/admin/scheduler/jobs/${jobId}/stop`, {
      method: "POST",
      headers: {
        "Authorization": authHeader || "",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Scheduler Stop] Backend error:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to stop job" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Disable caching
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[Scheduler Stop] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
