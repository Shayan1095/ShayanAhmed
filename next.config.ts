import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Font files read by the generated social images and icons.
  outputFileTracingIncludes: {
    "/**/*": ["./node_modules/@fontsource/{anybody,martian-mono,hanken-grotesk}/files/*-latin-*.woff"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
