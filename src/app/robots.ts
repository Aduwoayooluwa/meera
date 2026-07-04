import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://meera.zynnode.cc";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/login", "/signup", "/logo.png"],
        disallow: ["/api/", "/memories", "/insights"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
