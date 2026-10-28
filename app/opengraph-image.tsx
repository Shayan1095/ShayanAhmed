import { ImageResponse } from "next/og";
import { OgFrame, ogContentType, ogFonts, ogSize } from "@/lib/og";

export const alt = "Shayan Ahmed: websites with the systems built in.";
export const size = ogSize;
export const contentType = ogContentType;

/** Default social preview for the homepage and any page without its own. */
export default async function Image() {
  return new ImageResponse(
    (
      <OgFrame
        label="Full-stack developer · Pakistan"
        lines={["Websites with", "the systems", "built in."]}
        strip={{ tag: "Order", text: "#1042 flagged, owner notified" }}
      />
    ),
    { ...size, fonts: await ogFonts() },
  );
}
