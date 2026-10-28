import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db } from "../db";
import { images } from "../db/schema";
import { UserError } from "../errors";
import { newId } from "../ids";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;
const ACCEPTED = /^image\/(jpeg|png|webp|heic|heif|avif|gif)$/;

/**
 * Redimensionne et compresse une photo en WebP (format plein et miniature).
 * Les connexions mobiles en Guyane sont lentes et chères : on vise ~150 Ko.
 */
export async function processImage(input: Buffer) {
  try {
    const base = sharp(input, { failOn: "error" }).rotate();
    const full = await base
      .clone()
      .resize({ width: 1400, height: 1400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 78 })
      .toBuffer({ resolveWithObject: true });
    const thumb = await base
      .clone()
      .resize({ width: 480, height: 480, fit: "cover", position: "attention" })
      .webp({ quality: 72 })
      .toBuffer();
    return { data: full.data, width: full.info.width, height: full.info.height, thumb };
  } catch {
    throw new UserError("Une des photos n'a pas pu être lue. Utilisez une image JPEG, PNG ou WebP.");
  }
}

export async function saveImage(ownerId: string | null, input: Buffer): Promise<string> {
  const processed = await processImage(input);
  const id = newId(16);
  await db.insert(images).values({
    id,
    ownerId,
    mime: "image/webp",
    width: processed.width,
    height: processed.height,
    data: processed.data,
    thumb: processed.thumb,
  });
  return id;
}

/** Lit les fichiers d'un formulaire et vérifie leur type et leur taille. */
export async function readImageFiles(files: FormDataEntryValue[], max: number): Promise<Buffer[]> {
  const valid = files.filter((f): f is File => typeof f === "object" && "size" in f && f.size > 0);
  if (valid.length > max) throw new UserError(`${max} photos maximum.`);
  const buffers: Buffer[] = [];
  for (const file of valid) {
    if (file.size > MAX_UPLOAD_BYTES) throw new UserError("Chaque photo doit faire moins de 12 Mo.");
    if (file.type && !ACCEPTED.test(file.type)) throw new UserError("Format de photo non accepté.");
    buffers.push(Buffer.from(await file.arrayBuffer()));
  }
  return buffers;
}

export async function getImage(id: string, size: "full" | "thumb") {
  const [row] = await db
    .select({ data: size === "thumb" ? images.thumb : images.data, mime: images.mime })
    .from(images)
    .where(eq(images.id, id))
    .limit(1);
  return row;
}
