import { useId, type SVGProps } from "react";

/**
 * SA monogram — Shayan Ahmed.
 * variant "badge"  : flat tile, for the navbar and anything under 64px (default)
 * variant "keycap" : dimensional graphite key, for 64px and up (about, footer, OG images)
 * variant "mono"   : letters only; tone "copper" (dark backgrounds) | "cream" | "ink" (light backgrounds)
 * All letterforms are outlined paths — no fonts, no strokes.
 */
const S_KEY = "M48.2 44.5A3.7 4.4 0 0 0 44.5 40.1L43.5 40.1A3.7 4.4 0 0 0 39.8 44.5L39.8 48.75A3.95 3.95 0 0 0 43.75 52.7L44.25 52.7A12.55 12.55 0 0 1 56.8 65.25L56.8 71.5A12.3 13 0 0 1 44.5 84.5L43.5 84.5A12.3 13 0 0 1 31.2 71.5L31.2 70.5L39.8 70.5L39.8 71.5A3.7 4.4 0 0 0 43.5 75.9L44.5 75.9A3.7 4.4 0 0 0 48.2 71.5L48.2 65.25A3.95 3.95 0 0 0 44.25 61.3L43.75 61.3A12.55 12.55 0 0 1 31.2 48.75L31.2 44.5A12.3 13 0 0 1 43.5 31.5L44.5 31.5A12.3 13 0 0 1 56.8 44.5Z";
const S_BADGE = "M47 44.5A2.5 3.2 0 0 0 44.5 41.3L43.5 41.3A2.5 3.2 0 0 0 41 44.5L41 48.75A2.75 2.75 0 0 0 43.75 51.5L44.25 51.5A13.75 13.75 0 0 1 58 65.25L58 71.5A13.5 14.2 0 0 1 44.5 85.7L43.5 85.7A13.5 14.2 0 0 1 30 71.5L30 70.5L41 70.5L41 71.5A2.5 3.2 0 0 0 43.5 74.7L44.5 74.7A2.5 3.2 0 0 0 47 71.5L47 65.25A2.75 2.75 0 0 0 44.25 62.5L43.75 62.5A13.75 13.75 0 0 1 30 48.75L30 44.5A13.5 14.2 0 0 1 43.5 30.3L44.5 30.3A13.5 14.2 0 0 1 58 44.5Z";
const A = "M56.5 84L67.5 32H77.5L88.5 84H79.7L76.95 71H68.05L65.3 84ZM72.5 50L75.15 62.5H69.85Z";

type Props = Omit<SVGProps<SVGSVGElement>, "viewBox"> & {
  variant?: "badge" | "keycap" | "mono";
  tone?: "copper" | "cream" | "ink";
  size?: number;
  title?: string;
};

export function SALogo({ variant = "badge", tone = "copper", size = 38, title = "Shayan Ahmed", ...rest }: Props) {
  const uid = useId().replace(/:/g, "");
  const cu = `sa-cu-${uid}`;
  const wall = `sa-wall-${uid}`;
  const face = `sa-face-${uid}`;

  const copper = (
    <linearGradient id={cu} gradientUnits="userSpaceOnUse" x1="0" y1="30" x2="0" y2="85">
      <stop offset="0" stopColor="#FBE3C2" />
      <stop offset=".4" stopColor="#E8B07A" />
      <stop offset=".7" stopColor="#C98C55" />
      <stop offset="1" stopColor="#9E6034" />
    </linearGradient>
  );

  if (variant === "mono") {
    const fill = tone === "copper" ? `url(#${cu})` : tone === "cream" ? "#F3EADB" : "#120C08";
    return (
      <svg viewBox="29 29 62 58" width={(size * 62) / 58} height={size} role="img" aria-label={title} {...rest}>
        {tone === "copper" && <defs>{copper}</defs>}
        <path d={S_KEY} fill={fill} />
        <path d={A} fill={fill} fillRule="evenodd" />
      </svg>
    );
  }

  if (variant === "keycap") {
    return (
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={title} {...rest}>
        <defs>
          <linearGradient id={wall} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3D2D21" />
            <stop offset=".55" stopColor="#1A110B" />
            <stop offset="1" stopColor="#0A0604" />
          </linearGradient>
          <radialGradient id={face} cx=".5" cy=".32" r=".75">
            <stop offset="0" stopColor="#3B2D22" />
            <stop offset=".55" stopColor="#241A12" />
            <stop offset="1" stopColor="#18100B" />
          </radialGradient>
          {copper}
        </defs>
        <rect x="7" y="13" width="106" height="103" rx="26" fill="#000" fillOpacity=".45" />
        <rect x="4" y="4" width="112" height="108" rx="27" fill={`url(#${wall})`} />
        <rect x="4.5" y="4.5" width="111" height="107" rx="26.5" fill="none" stroke="#FFE6CC" strokeOpacity=".10" />
        <rect x="12" y="8" width="96" height="88" rx="20" fill={`url(#${face})`} />
        <rect x="12.5" y="8.5" width="95" height="87" rx="19.5" fill="none" stroke="#FFE6CC" strokeOpacity=".14" />
        <path d="M34 9H86" fill="none" stroke="#FFF0DC" strokeOpacity=".28" strokeWidth=".8" strokeLinecap="round" />
        <g transform="translate(60 52.25) scale(1.06) translate(-59.75 -57.75)">
          <g transform="translate(0 1.6)" opacity=".6">
            <path d={S_KEY} fill="#000" />
            <path d={A} fill="#000" fillRule="evenodd" />
          </g>
          <path d={S_KEY} fill={`url(#${cu})`} />
          <path d={A} fill={`url(#${cu})`} fillRule="evenodd" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={title} {...rest}>
      <rect x="4" y="4" width="112" height="112" rx="26" fill="#1E150F" />
      <rect x="4.75" y="4.75" width="110.5" height="110.5" rx="25.25" fill="none" stroke="#E8B27A" strokeOpacity=".45" strokeWidth="1.5" />
      <g transform="translate(.25 2)" fill="#E8B27A">
        <path d={S_BADGE} />
        <path d={A} fillRule="evenodd" />
      </g>
    </svg>
  );
}

export default SALogo;
