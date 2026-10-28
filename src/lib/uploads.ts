import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);
const MAX_BYTES = 8 * 1024 * 1024;

export function uploadDir() {
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR || "./uploads");
}

/**
 * Enregistre un fichier envoyé et renvoie son URL, ou null si vide.
 * `private` : document sensible (permis) servi uniquement à son propriétaire et aux admins.
 */
export async function saveUpload(file: FormDataEntryValue | null, opts: { allowPdf?: boolean; private?: boolean } = {}): Promise<string | null> {
  if (!file || typeof file === "string" || file.size === 0) return null;
  const ext = ALLOWED.get(file.type);
  if (!ext || (ext === "pdf" && !opts.allowPdf)) throw new Error("Format de fichier non accepté (JPG, PNG ou WebP).");
  if (file.size > MAX_BYTES) throw new Error("Fichier trop volumineux (8 Mo maximum).");
  const name = `${opts.private ? "p-" : ""}${randomUUID()}.${ext}`;
  await mkdir(uploadDir(), { recursive: true });
  await writeFile(path.join(/*turbopackIgnore: true*/ uploadDir(), name), Buffer.from(await file.arrayBuffer()));
  return `/api/files/${name}`;
}

export async function saveUploads(files: FormDataEntryValue[], max = 10): Promise<string[]> {
  const urls: string[] = [];
  for (const f of files.slice(0, max)) {
    const url = await saveUpload(f);
    if (url) urls.push(url);
  }
  return urls;
}
