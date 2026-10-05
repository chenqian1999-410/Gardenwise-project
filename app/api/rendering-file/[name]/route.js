import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

const contentTypes = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp"
};

export async function GET(_request, { params }) {
  const safeName = path.basename(params.name || "");
  const ext = safeName.split(".").pop()?.toLowerCase();

  if (!safeName || !contentTypes[ext]) {
    return NextResponse.json({ error: "Invalid rendering file." }, { status: 400 });
  }

  try {
    const filePath = path.join(process.cwd(), "public", "renderings", safeName);
    const file = await readFile(filePath);
    return new NextResponse(file, {
      headers: {
        "Content-Type": contentTypes[ext],
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Rendering file not found." }, { status: 404 });
  }
}
