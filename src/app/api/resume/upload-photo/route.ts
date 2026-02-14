import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const BUCKET_NAME = "resume-photos";

// Проверка и создание bucket если не существует
async function ensureBucketExists() {
  const supabase = getSupabaseAdmin();

  // Проверяем существование bucket
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

  if (!bucketExists) {
    console.log(`Creating bucket: ${BUCKET_NAME}`);
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    });

    if (error) {
      console.error("Error creating bucket:", error);
      // Не бросаем ошибку, возможно bucket уже создан вручную
    } else {
      // Делаем bucket публичным
      await supabase.storage.updateBucket(BUCKET_NAME, {
        public: true,
      });
    }
  }
}

// Генерация уникального имени файла
function generateFileName(userId: string, originalName: string): string {
  const timestamp = Date.now();
  const ext = originalName.split(".").pop();
  const random = Math.random().toString(36).substring(2, 8);
  return `${userId}/${timestamp}-${random}.${ext}`;
}

export async function POST(req: NextRequest) {
  try {
    // Получаем токен из Authorization заголовка
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Upload photo - No auth header");
      return NextResponse.json(
        { detail: "Не авторизован" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    // Проверяем токен с Supabase
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    console.log("Upload photo - Auth check:", { error, user: user?.id });

    if (error || !user) {
      console.log("Upload photo - Auth failed:", error);
      return NextResponse.json(
        { detail: "Не авторизован" },
        { status: 401 }
      );
    }

    // Получаем файл из FormData
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { detail: "Файл не найден" },
        { status: 400 }
      );
    }

    // Валидация типа файла
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { detail: "Неподдерживаемый тип файла. Используйте JPG, PNG или WebP." },
        { status: 400 }
      );
    }

    // Валидация размера (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { detail: "Размер файла не должен превышать 5MB" },
        { status: 400 }
      );
    }

    // Убеждаемся что bucket существует
    await ensureBucketExists();

    const adminSupabase = getSupabaseAdmin();
    const fileName = generateFileName(user.id, file.name);

    // Конвертируем File в ArrayBuffer для Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    // Загружаем файл в Supabase Storage
    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileData, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { detail: "Не удалось загрузить файл" },
        { status: 500 }
      );
    }

    // Получаем публичный URL
    const { data: urlData } = adminSupabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName, {
        download: false,
      });

    return NextResponse.json({
      url: urlData.publicUrl,
      path: fileName,
    });

  } catch (error) {
    console.error("Upload photo error:", error);
    return NextResponse.json(
      { detail: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
