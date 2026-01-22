import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Читаем версию из package.json
    const packagePath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
    const appVersion = packageJson.version || "0.0.0";

    // Читаем git commit из файла .version (создаётся при деплое)
    const versionPath = path.join(process.cwd(), ".version");
    let gitCommit = null;
    if (fs.existsSync(versionPath)) {
      gitCommit = fs.readFileSync(versionPath, "utf-8").trim();
    }

    // Формируем версию: "0.3.5" или "0.3.5 (abc1234)"
    const version = gitCommit ? `${appVersion} (${gitCommit})` : appVersion;

    return NextResponse.json({
      version,
      appVersion,
      gitCommit,
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
