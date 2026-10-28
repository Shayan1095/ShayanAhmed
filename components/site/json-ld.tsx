import type { Project, SiteSettings } from "@/lib/content/types";
import { site } from "@/lib/site";

/** Renders a JSON-LD block safely. */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * Homepage structured data: who Shayan is (Person), what he offers
 * (ProfessionalService) and the site (WebSite). Only true, known facts.
 */
export function homeJsonLd(settings: SiteSettings, projects: Project[]) {
  const personId = `${site.url}/#person`;
  const sameAs = [settings.linkedin].filter(Boolean) as string[];
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": personId,
        name: site.name,
        jobTitle: site.role,
        description: site.description,
        url: site.url,
        ...(settings.portrait && { image: new URL(settings.portrait.src, site.url).toString() }),
        ...(settings.email && { email: `mailto:${settings.email}` }),
        ...(sameAs.length > 0 && { sameAs }),
        address: { "@type": "PostalAddress", addressCountry: "PK" },
        knowsLanguage: ["en", "ur"],
        knowsAbout: ["Next.js", "React", "Node.js", "MongoDB", "Web development", "Business automation"],
      },
      {
        "@type": "ProfessionalService",
        "@id": `${site.url}/#service`,
        name: `${site.name} · Websites, systems and automation`,
        url: site.url,
        description:
          "Websites customers see, systems teams run on, and automations inside them, for clients in Pakistan and abroad.",
        founder: { "@id": personId },
        areaServed: "Worldwide",
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Services",
          itemListElement: ["Website", "System", "Automation"].map((name) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Service", name },
          })),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.name,
        publisher: { "@id": personId },
        inLanguage: "en",
      },
      {
        "@type": "ItemList",
        name: "Case studies",
        itemListElement: projects
          .filter((p) => p.hasCaseStudy)
          .map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${site.url}/work/${p.slug}`, name: p.title })),
      },
    ],
  };
}
