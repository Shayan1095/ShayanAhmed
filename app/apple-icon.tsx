import { keycapIcon } from "@/lib/keycap-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** iOS rounds the corners itself, so the square fills the canvas. */
export default function AppleIcon() {
  return keycapIcon(180, { rounded: false });
}
