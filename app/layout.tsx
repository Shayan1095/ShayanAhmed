import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { site } from "@/lib/site";
import { siteThemeScript } from "@/lib/theme-script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} · Full-stack developer for websites, systems and automation`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  keywords: [
    "Shayan Ahmed",
    "full-stack developer",
    "Next.js developer",
    "MERN developer",
    "web developer Pakistan",
    "business automation",
    "management system development",
    "e-commerce operations",
  ],
  category: "technology",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: site.locale,
    url: "/",
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} · ${site.tagline}`,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3EADB" },
    { media: "(prefers-color-scheme: dark)", color: "#110F0D" },
  ],
  colorScheme: "light dark",
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // suppressHydrationWarning: the theme scripts set data-theme / data-admin-theme on <html> before React loads (no flash).
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: siteThemeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
