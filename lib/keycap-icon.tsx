import "server-only";
import { ImageResponse } from "next/og";
import { fontFile } from "./og";

/** The SA keycap as an app icon at any size. */
export async function keycapIcon(px: number, opts: { rounded?: boolean } = {}) {
  const font = await fontFile("anybody", "anybody-latin-800-normal.woff");
  const r = opts.rounded === false ? 0 : Math.round(px * 0.22);
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: r,
          background: "linear-gradient(180deg, #2c2a27, #111111)",
          boxShadow: `inset 0 ${-Math.max(2, px * 0.08)}px 0 #000`,
          color: "#F3EADB",
          fontFamily: "Anybody",
          fontWeight: 800,
          fontSize: Math.round(px * 0.42),
          letterSpacing: -px * 0.01,
          paddingBottom: Math.round(px * 0.05),
        }}
      >
        SA
      </div>
    ),
    { width: px, height: px, fonts: [{ name: "Anybody", data: font, weight: 800, style: "normal" }] },
  );
}
