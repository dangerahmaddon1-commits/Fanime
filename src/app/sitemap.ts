import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

  // Do not publish guessed canonical URLs before the production hostname is configured.
  if (!siteUrl) return [];

  const lastModified = new Date();

  return [
    { url: siteUrl, lastModified, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/home`, lastModified, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/search`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/schedule`, lastModified, changeFrequency: "daily", priority: 0.7 },
  ];
}
