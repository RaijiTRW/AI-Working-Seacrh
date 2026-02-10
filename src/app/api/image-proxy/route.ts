import { NextRequest, NextResponse } from "next/server";

const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^0\.0\.0\.0$/,
  /^\[?::1\]?$/,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
];

function isBlockedHost(hostname: string): boolean {
  return BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(hostname));
}

function getSafeTargetUrl(rawUrl: string | null): URL | null {
  if (!rawUrl) {
    return null;
  }

  try {
    const url = new URL(rawUrl);
    const protocolAllowed = url.protocol === "http:" || url.protocol === "https:";
    if (!protocolAllowed) {
      return null;
    }

    if (isBlockedHost(url.hostname)) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function buildProxyHeaders(contentType: string | null): Headers {
  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=86400");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Access-Control-Allow-Origin", "*");

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  return headers;
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  const targetUrl = getSafeTargetUrl(rawUrl);

  if (!targetUrl) {
    return NextResponse.json({ error: "Invalid image URL" }, { status: 400 });
  }

  try {
    const response = await fetch(targetUrl.toString(), {
      method: "GET",
      redirect: "follow",
      cache: "force-cache",
      headers: {
        "User-Agent": "JobAISearch-ImageProxy/1.0",
        "Accept": "image/*,*/*;q=0.8",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: 502 }
      );
    }

    const contentType = response.headers.get("content-type");
    if (contentType && !contentType.startsWith("image/")) {
      return NextResponse.json({ error: "URL does not point to an image" }, { status: 415 });
    }

    const arrayBuffer = await response.arrayBuffer();
    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: buildProxyHeaders(contentType),
    });
  } catch (error) {
    console.error("[ImageProxy] error:", error);
    return NextResponse.json({ error: "Image proxy failed" }, { status: 500 });
  }
}
