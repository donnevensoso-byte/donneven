"use client";

import { useEffect, useRef, useState } from "react";
import { imageUrl } from "./ui";

const MAX_SIDE = 1800;

/** Réduit la photo dans le navigateur avant l'envoi (connexions mobiles lentes). */
async function downscale(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1_500_000) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}

type Existing = { id: string };

export function PhotoInput({ max, existing = [] }: { max: number; existing?: Existing[] }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const kept = existing.filter((e) => !removed.includes(e.id));
  const remaining = max - kept.length - files.length;

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    if (inputRef.current) {
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      inputRef.current.files = dt.files;
    }
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []).slice(0, Math.max(0, remaining));
    e.target.value = "";
    if (picked.length === 0) return;
    setBusy(true);
    const resized = await Promise.all(picked.map(downscale));
    setBusy(false);
    setFiles((prev) => [...prev, ...resized]);
  }

  return (
    <div>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {kept.map((img, i) => (
          <li key={img.id} className="relative aspect-square overflow-hidden rounded-xl bg-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl(img.id, "thumb")} alt="" className="size-full object-cover" />
            {i === 0 && <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[10px] font-semibold text-white">Couverture</span>}
            <button
              type="button"
              onClick={() => setRemoved((r) => [...r, img.id])}
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-white/90 text-sm shadow"
              aria-label="Retirer la photo"
            >
              ✕
            </button>
          </li>
        ))}
        {previews.map((src, i) => (
          <li key={src} className="relative aspect-square overflow-hidden rounded-xl bg-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="size-full object-cover" />
            {kept.length === 0 && i === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[10px] font-semibold text-white">Couverture</span>
            )}
            <button
              type="button"
              onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-white/90 text-sm shadow"
              aria-label="Retirer la photo"
            >
              ✕
            </button>
          </li>
        ))}
        {remaining > 0 && (
          <li>
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-white text-center text-xs font-medium text-muted hover:border-brand-200 hover:text-brand-700">
              <span className="text-2xl" aria-hidden>
                {busy ? "⏳" : "📷"}
              </span>
              {busy ? "Préparation…" : "Ajouter"}
              <input type="file" accept="image/*" multiple className="sr-only" onChange={onPick} data-testid="photo-picker" />
            </label>
          </li>
        )}
      </ul>
      {/* Champ réellement envoyé avec le formulaire */}
      <input ref={inputRef} type="file" name="photos" multiple hidden tabIndex={-1} aria-hidden />
      {removed.map((id) => (
        <input key={id} type="hidden" name="removeImage" value={id} />
      ))}
      <p className="hint">
        Jusqu&apos;à {max} photos. La première sert de couverture. Montrez le matériel en entier, à la lumière du jour.
      </p>
    </div>
  );
}
