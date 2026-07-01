import type { MetadataRoute } from "next";
import { APP_DOMAIN } from "@/config/app";
import { announcements } from "@/content/announcements";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${APP_DOMAIN}`;

  const staticRoutes = [
    "",
    "/signup",
    "/pricing",
    "/changelog",
    "/roadmap",
    "/announcements",
    "/privacy",
    "/terms",
    "/cookies",
  ].map((path) => ({
    url: `${base}${path}`,
  }));

  const announcementRoutes = announcements.map((post) => ({
    url: `${base}/announcements/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  return [...staticRoutes, ...announcementRoutes];
}
