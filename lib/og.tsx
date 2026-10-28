import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { cacheLife } from "next/cache";

/** Social preview images (Open Graph / X): 1200 × 630, built in the site's own style. */
export const ogSize = { width: 1200, height: 630 };
export const ogContentType = "image/png";

/** Cached so generated images can be prerendered instead of built per request. */
export async function fontFile(pkg: string, file: string): Promise<ArrayBuffer> {
  "use cache";
  cacheLife("max");
  const buf = await readFile(join(process.cwd(), "node_modules", "@fontsource", pkg, "files", file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

/** Static font cuts (the image renderer can't use variable fonts or woff2). */
export async function ogFonts() {
  const [display, displayItalic, mono, body] = await Promise.all([
    fontFile("anybody", "anybody-latin-800-normal.woff"),
    fontFile("anybody", "anybody-latin-700-italic.woff"),
    fontFile("martian-mono", "martian-mono-latin-400-normal.woff"),
    fontFile("hanken-grotesk", "hanken-grotesk-latin-500-normal.woff"),
  ]);
  return [
    { name: "Anybody", data: display, weight: 800 as const, style: "normal" as const },
    { name: "Anybody", data: displayItalic, weight: 700 as const, style: "italic" as const },
    { name: "Martian", data: mono, weight: 400 as const, style: "normal" as const },
    { name: "Hanken", data: body, weight: 500 as const, style: "normal" as const },
  ];
}

/** Reads a /public image as a data URL for embedding (e.g. a project screenshot). */
export async function publicImageDataUrl(src: string) {
  "use cache";
  cacheLife("max");
  if (!src.startsWith("/")) return src;
  const buf = await readFile(join(process.cwd(), "public", src));
  const ext = src.split(".").pop()?.toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}

const c = {
  paper: "#F3EADB",
  paperHi: "#FBF6EC",
  paperLo: "#E4D8C3",
  edge: "#CDBFA6",
  ink: "#111111",
  ink2: "#1E1C1A",
  muted: "#675E52",
  mutedInk: "#A89D8B",
  walnut: "#6B4A2F",
  copper: "#C9853F",
};

type OgFrameProps = {
  label: string;
  /** Headline lines; the last one is set in walnut italic. */
  lines: string[];
  strip: { tag: string; text: string };
  /** Optional right-hand visual (a screenshot data URL). */
  image?: string;
  /** Optional supporting line under the headline. */
  summary?: string;
  /** Top-right signature. */
  signature?: string;
};

/** The shared composition. Satori subset of CSS: flexbox only. */
export function OgFrame({ label, lines, strip, image, summary, signature = "Shayan Ahmed" }: OgFrameProps) {
  const headSize = image ? 76 : lines.some((l) => l.length > 14) ? 92 : 112;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: `radial-gradient(110% 90% at 70% 40%, ${c.paperHi} 0%, ${c.paper} 55%, #ECE1CD 100%)`,
        fontFamily: "Hanken",
        color: c.ink,
      }}
    >
      <div style={{ display: "flex", flex: 1, padding: "56px 64px 0 64px", gap: 48 }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 52,
                height: 50,
                borderRadius: 12,
                background: c.ink,
                color: c.paper,
                fontFamily: "Anybody",
                fontWeight: 800,
                fontSize: 18,
                boxShadow: "0 4px 0 #000",
              }}
            >
              SA
            </div>
            <div style={{ display: "flex", fontFamily: "Martian", fontSize: 16, letterSpacing: 2.5, color: c.muted, textTransform: "uppercase" }}>
              {label}
            </div>
            {!image && (
              <div
                style={{
                  display: "flex",
                  marginLeft: "auto",
                  fontFamily: "Anybody",
                  fontWeight: 800,
                  fontSize: 22,
                  letterSpacing: -0.5,
                  textTransform: "uppercase",
                }}
              >
                {signature}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 34 }}>
            {lines.map((l, i) => {
              const last = i === lines.length - 1;
              return (
                <div
                  key={l}
                  style={{
                    display: "flex",
                    fontFamily: "Anybody",
                    fontWeight: last ? 700 : 800,
                    fontStyle: last ? "italic" : "normal",
                    fontSize: headSize,
                    lineHeight: 0.9,
                    letterSpacing: -3,
                    textTransform: "uppercase",
                    color: last ? c.walnut : c.ink,
                  }}
                >
                  {l}
                </div>
              );
            })}
          </div>
          {summary && (
            <div style={{ display: "flex", marginTop: 28, maxWidth: image ? 560 : 900, fontSize: 27, lineHeight: 1.4, color: c.muted }}>
              {summary}
            </div>
          )}
        </div>
        {image && (
          <div
            style={{
              display: "flex",
              width: 470,
              height: 330,
              marginTop: 36,
              padding: 12,
              borderRadius: 22,
              background: `linear-gradient(180deg, #2b2926, ${c.ink2})`,
              boxShadow: "0 30px 60px -30px rgba(17,17,17,.7)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" width={446} height={306} style={{ borderRadius: 12, objectFit: "cover", objectPosition: "top" }} />
          </div>
        )}
      </div>

      {/* The live strip, as on the hero slab */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 116,
          padding: "0 64px",
          background: `linear-gradient(180deg, #1d1b18, #0c0b0a)`,
          borderTop: `4px solid ${c.copper}`,
          fontFamily: "Martian",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 24, maxWidth: 920, overflow: "hidden", whiteSpace: "nowrap" }}>
          <div style={{ display: "flex", color: c.copper, textTransform: "uppercase" }}>{strip.tag}</div>
          <div style={{ display: "flex", color: c.paper }}>{strip.text}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, letterSpacing: 2, color: c.mutedInk, textTransform: "uppercase" }}>
          <div style={{ display: "flex", width: 10, height: 10, borderRadius: 10, background: c.copper, boxShadow: `0 0 12px ${c.copper}` }} />
          Live
        </div>
      </div>
    </div>
  );
}
