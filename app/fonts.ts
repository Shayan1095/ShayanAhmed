import { Archivo, Geist, Martian_Mono } from "next/font/google";

/**
 * Three families, one voice: Archivo for every heading (heavy, its width axis
 * runs from the condensed masthead to normal headings), Geist for reading
 * text, Martian Mono for small hardware labels.
 */

/** Headings and the hero masthead / intro name (condensed via the width axis). */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

/** Body copy: open and sturdy at small sizes on the dark background. */
export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

/** Hardware labels. */
export const martian = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian",
  display: "swap",
  // Small labels only: don't compete with the headline and body fonts on first load.
  preload: false,
});

export const fontVariables = `${archivo.variable} ${geist.variable} ${martian.variable}`;
