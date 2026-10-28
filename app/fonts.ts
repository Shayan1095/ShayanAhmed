import { Anybody, Hanken_Grotesk, Martian_Mono } from "next/font/google";

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
  display: "swap",
});

/** Hardware labels. */
export const martian = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-martian",
  display: "swap",
});

export const fontVariables = `${anybody.variable} ${hanken.variable} ${martian.variable}`;
