import { readFileSync } from "node:fs";

const apps = JSON.parse(readFileSync(new URL("./apps.json", import.meta.url), "utf8"));
const noCache = [{ key: "Cache-Control", value: "no-cache" }];
const immutable = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async headers() {
    const revalidate = apps.flatMap((a) => [
      { source: `/bundles/${a.slug}/index.html`, headers: noCache },
      { source: `/bundles/${a.slug}/app/${a.slug}-web.js`, headers: noCache },
      { source: `/bundles/${a.slug}/app/parts.txt`, headers: noCache },
    ]);
    return [
      // generic hashed-asset rules first; exact no-cache rules below take precedence
      { source: "/bundles/:slug/app/:path*", headers: immutable },
      { source: "/bundles/:slug/:file", headers: immutable },
      ...revalidate,
    ];
  },
};
export default nextConfig;
