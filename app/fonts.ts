import { Anybody, Archivo, Hanken_Grotesk, Instrument_Serif, Martian_Mono } from "next/font/google";

/** Display: variable width + weight, roman and italic. */
export const anybody = Anybody({
  subsets: ["latin"],
  axes: ["wdth"],
  style: ["normal", "italic"],
  variable: "--font-anybody",
  display: "swap",
});

/** Body copy. */
export const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-hanken",
  // Body copy is the largest text on phones: no late swap repainting it on slow
  // connections (the size-matched fallback stays for that first visit).
  display: "optional",
});

/** Hardware labels. */
export const martian = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian",
  display: "swap",
  // Small labels only: don't compete with the headline and body fonts on first load.
  preload: false,
});

/** Hero masthead ("THE BUILD"): heavy and condensed, so it needs the width axis. */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

/** Hero headline and the Built-in index: editorial serif, roman and italic. */
export const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

export const fontVariables = `${anybody.variable} ${hanken.variable} ${martian.variable} ${archivo.variable} ${instrument.variable}`;
