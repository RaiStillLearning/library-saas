import type { MetadataRoute } from "next";
import { getBooks } from "@/src/services/api/books";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://kamarprogrammer.site";

  // Core static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/categories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/discover`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/openlibrary`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/library`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/reading-lists`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/history`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  try {
    // Fetch featured/top books to include them as dynamic routes in the sitemap
    const featuredData = await getBooks({ page: 1 });
    const books = featuredData?.books || [];

    const dynamicBookRoutes = books.map((book) => ({
      url: `${baseUrl}/books/${book._id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...dynamicBookRoutes];
  } catch (error) {
    console.error("Failed to generate dynamic book routes for sitemap:", error);
    return staticRoutes;
  }
}
