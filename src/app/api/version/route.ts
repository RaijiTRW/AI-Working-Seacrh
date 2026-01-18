import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Читаем текущую версию из файла .version (создаётся при деплое)
    const versionPath = path.join(process.cwd(), ".version");

    let version = "dev";
    if (fs.existsSync(versionPath)) {
      version = fs.readFileSync(versionPath, "utf-8").trim();
    }

    return NextResponse.json({
      version,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Version] Error:", error);
    return NextResponse.json(
      { version: "unknown", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
