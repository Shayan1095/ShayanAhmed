import { Readable } from "node:stream";
import { openStoredImage } from "@/lib/media";

/**
 * Serves images uploaded from the admin (stored in MongoDB). Each upload gets
 * a new id, so responses never change and can be cached for a year.
 */
export async function GET(_req: Request, { params }: RouteContext<"/api/media/[id]">) {
  const { id } = await params;
  const file = await openStoredImage(id).catch(() => null);
  if (!file) return new Response("Not found", { status: 404 });
  return new Response(Readable.toWeb(file.stream) as ReadableStream, {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
