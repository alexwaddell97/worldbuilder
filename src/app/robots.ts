import type { MetadataRoute } from "next";
import { APP_DOMAIN } from "@/config/app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/settings", "/two-factor-setup", "/worlds/", "/api/"],
      },
    ],
    sitemap: `https://${APP_DOMAIN}/sitemap.xml`,
  };
}
