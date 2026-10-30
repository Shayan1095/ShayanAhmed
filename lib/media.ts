import "server-only";
import { Readable } from "node:stream";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import type { ImageRef } from "@/lib/content/types";
import { requireDb } from "@/lib/db/connect";

/**
 * Image storage for admin uploads. Uses Cloudinary when CLOUDINARY_URL is set;
 * otherwise stores the file in MongoDB (GridFS) and serves it from
 * /api/media/<id>, so uploads work with nothing but the database.
 */

export const MEDIA_PREFIX = "/api/media/";
const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif"];

async function bucket() {
  const conn = await requireDb();
  return new mongoose.mongo.GridFSBucket(conn.connection.db!, { bucketName: "media" });
}

export async function storeImage(file: File, size: { width: number; height: number }): Promise<ImageRef> {
  if (!TYPES.includes(file.type)) throw new Error("Use a PNG, JPG, WebP, AVIF or GIF image.");
  if (file.size > MAX_BYTES) throw new Error("Images must be under 8 MB.");
  const bytes = Buffer.from(await file.arrayBuffer());

  if (process.env.CLOUDINARY_URL) {
    const res = await cloudinary.uploader.upload(`data:${file.type};base64,${bytes.toString("base64")}`, {
      folder: "portfolio",
      resource_type: "image",
    });
    return { src: res.secure_url, alt: "", width: res.width, height: res.height };
  }

  if (!(size.width > 0 && size.height > 0)) throw new Error("Couldn't read the image size. Try another file.");
  const b = await bucket();
  const id = await new Promise<mongoose.Types.ObjectId>((resolve, reject) => {
    const up = b.openUploadStream(file.name.slice(0, 120) || "image", {
      metadata: { contentType: file.type, width: size.width, height: size.height },
    });
    Readable.from(bytes).pipe(up).on("error", reject).on("finish", () => resolve(up.id as mongoose.Types.ObjectId));
  });
  return { src: `${MEDIA_PREFIX}${id}`, alt: "", width: Math.round(size.width), height: Math.round(size.height) };
}

/** Deletes a stored upload when it is replaced or removed (Cloudinary and plain URLs are left alone). */
export async function deleteStoredImage(src: string | undefined | null) {
  if (!src?.startsWith(MEDIA_PREFIX)) return;
  const id = src.slice(MEDIA_PREFIX.length);
  if (!/^[a-f0-9]{24}$/.test(id)) return;
  try {
    await (await bucket()).delete(new mongoose.Types.ObjectId(id));
  } catch {
    // Already gone.
  }
}

/** Reads one stored image for the media route. */
export async function openStoredImage(id: string) {
  if (!/^[a-f0-9]{24}$/.test(id)) return null;
  const b = await bucket();
  const oid = new mongoose.Types.ObjectId(id);
  const [file] = await b.find({ _id: oid }).limit(1).toArray();
  if (!file) return null;
  return {
    contentType: String(file.metadata?.contentType ?? "application/octet-stream"),
    length: file.length,
    stream: b.openDownloadStream(oid),
  };
}
