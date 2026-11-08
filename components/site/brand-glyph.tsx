import { useId } from "react";
import { Mail } from "lucide-react";
import { BRAND_ICONS } from "@/lib/content/brand-icons";
import { cn } from "@/lib/utils";

/**
 * A platform's real logo in its brand colour (Instagram in its gradient).
 * Email, which belongs to no brand, is a plain envelope. Decorative: the
 * link around it carries the name.
 */
export function BrandGlyph({ platform, className }: { platform: string; className?: string }) {
  const uid = useId().replace(/:/g, "");
  if (platform === "email") return <Mail aria-hidden="true" className={cn("text-[#f3eadb]", className)} strokeWidth={1.8} />;
  const icon = BRAND_ICONS[platform];
  if (!icon) return null;
  const gradient = platform === "instagram" ? `ig-${uid}` : undefined;
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className}>
      {gradient && (
        <defs>
          <radialGradient id={gradient} cx="30%" cy="107%" r="150%">
            <stop offset="0" stopColor="#fdf497" />
            <stop offset="0.05" stopColor="#fdf497" />
            <stop offset="0.45" stopColor="#fd5949" />
            <stop offset="0.6" stopColor="#d6249f" />
            <stop offset="0.9" stopColor="#285AEB" />
          </radialGradient>
        </defs>
      )}
      <path d={icon.path} fill={gradient ? `url(#${gradient})` : icon.color} />
    </svg>
  );
}
