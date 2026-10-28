import { readFile } from "node:fs/promises";
import path from "node:path";
import { uploadDir } from "@/lib/uploads";
import { getCurrentUser } from "@/lib/auth";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", pdf: "application/pdf" };

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  // noms générés par l'application uniquement : uuid + extension
  if (!/^(p-)?[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/.test(name)) return new Response("Not found", { status: 404 });
  const isPrivate = name.startsWith("p-");
  if (isPrivate) {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.licenseFileUrl !== `/api/files/${name}`)) return new Response("Not found", { status: 404 });
  }
  try {
    const data = await readFile(path.join(/*turbopackIgnore: true*/ uploadDir(), name));
    const ext = name.split(".").pop()!;
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": TYPES[ext], "Cache-Control": isPrivate ? "private, no-store" : "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
