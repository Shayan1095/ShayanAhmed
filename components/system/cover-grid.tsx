/**
 * The cutting-mat grid from the hero (24px fine lines, 120px major lines in
 * copper, fading out toward the edges). Used at full strength in the hero and
 * softer in the "building" sections: Services, Process, Contact. Decorative.
 *
 * Put it as the first child of a positioned section, and give the content
 * after it `relative` so it paints above the grid.
 */
export function CoverGrid({ strength = 1, className }: { strength?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
      style={{
        opacity: strength,
        backgroundImage:
          "linear-gradient(rgba(217,167,119,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(217,167,119,.06) 1px, transparent 1px), linear-gradient(rgba(217,167,119,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(217,167,119,.13) 1px, transparent 1px)",
        backgroundSize: "24px 24px, 24px 24px, 120px 120px, 120px 120px",
        WebkitMaskImage: "radial-gradient(ellipse 85% 80% at 50% 50%, #000 40%, transparent 100%)",
        maskImage: "radial-gradient(ellipse 85% 80% at 50% 50%, #000 40%, transparent 100%)",
      }}
    />
  );
}
