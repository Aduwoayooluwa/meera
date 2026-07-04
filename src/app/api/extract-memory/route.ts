import { NextResponse } from "next/server";

import { extractMemoryFromImage } from "@/lib/btl/client";
import { requireCurrentUser } from "@/lib/auth/session";
import { normalizeMemoryText } from "@/lib/memory/chunk-text";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const imageTypes = new Set([
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const textTypes = new Set([
  "text/markdown",
  "text/plain",
]);

function titleFromFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
}

function isMarkdownOrText(file: File) {
  const lowerName = file.name.toLowerCase();

  return (
    textTypes.has(file.type) ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".txt")
  );
}

export async function POST(request: Request) {
  try {
    await requireCurrentUser();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Upload a file to turn it into a memory.",
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error: "Keep uploads under 8 MB for this demo.",
        },
        { status: 413 },
      );
    }

    if (isMarkdownOrText(file)) {
      const text = normalizeMemoryText(await file.text());

      return NextResponse.json({
        contentText: text,
        title: titleFromFileName(file.name),
        type: "note",
      });
    }

    if (imageTypes.has(file.type)) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const extracted = await extractMemoryFromImage({
        base64: buffer.toString("base64"),
        fileName: file.name,
        mimeType: file.type,
      });

      return NextResponse.json({
        contentText: normalizeMemoryText(extracted),
        title: titleFromFileName(file.name) || "Image memory",
        type: "note",
      });
    }

    return NextResponse.json(
      {
        error: "Upload a screenshot, image, .txt, or .md file.",
      },
      { status: 400 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Memory Mirror could not read that upload.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: message.includes("sign in")
          ? 401
          : message.includes("BTL Runtime")
          ? 503
          : 400,
      },
    );
  }
}
