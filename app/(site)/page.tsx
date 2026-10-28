import { Label, SplitReveal } from "@/components/system";

// Temporary shell. The homepage sections are built in step 3 of DESIGN.md §13.
export default function HomePage() {
  return (
    <main className="wrap section-pad">
      <Label className="mb-6 block">Full-stack developer · Pakistan</Label>
      <SplitReveal as="h1" className="type-hero" start="top bottom">
        Websites with the systems <em>built in</em>.
      </SplitReveal>
    </main>
  );
}
