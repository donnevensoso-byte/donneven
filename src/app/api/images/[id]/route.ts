import { getImage } from "@/lib/services/images";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[A-Za-z0-9]{16}$/.test(id)) return new Response("Not found", { status: 404 });
  const size = new URL(request.url).searchParams.get("s") === "thumb" ? "thumb" : "full";
  const image = await getImage(id, size);
  if (!image) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.mime,
      // Les images sont immuables : un nouvel envoi crée un nouvel identifiant.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
