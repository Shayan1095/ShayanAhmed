"use client";

import type { ImageRef } from "@/lib/content/types";
import { uploadImage } from "@/app/admin/(panel)/content-actions";

/** Reads an image file's pixel size in the browser (needed for layout without shifts). */
function measure(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file isn't an image the browser can read."));
    };
    img.src = url;
  });
}

/** Uploads one image and returns its ImageRef, or throws with a message to show. */
export async function uploadFile(file: File): Promise<ImageRef> {
  if (!file.type.startsWith("image/")) throw new Error("Choose an image file.");
  if (file.size > 8 * 1024 * 1024) throw new Error("Images must be under 8 MB.");
  const size = await measure(file);
  const fd = new FormData();
  fd.set("file", file);
  fd.set("width", String(size.width));
  fd.set("height", String(size.height));
  const res = await uploadImage(fd);
  if (!res.ok) throw new Error(res.error);
  return res.data!;
}
