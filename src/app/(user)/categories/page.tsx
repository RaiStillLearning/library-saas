"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGenreStats } from "@/src/services/api/books";
import { CategoryCard } from "@/src/components/books/category-card";
import { Search, RefreshCw, Grid } from "lucide-react";
import { Category } from "@/src/lib/constants";

export default function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch real genre stats
  const { data: genreStatsRaw, isLoading, isFetching } = useQuery({
    queryKey: ["genre-stats"],
    queryFn: () => getGenreStats(),
    staleTime: 10 * 60 * 1000,
  });

  const genreStats: any[] = Array.isArray(genreStatsRaw)
    ? genreStatsRaw
    : (genreStatsRaw as any)?.genre_statistics || [];

  // Helper: map a string to a safe URL slug
  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Replace spaces with -
      .replace(/[^\w\-]+/g, "") // Remove all non-word chars
      .replace(/\-\-+/g, "-"); // Replace multiple - with single -
  };

  // Helper: map genre names to beautiful Lucide icons
  const getIconForGenre = (genre: string) => {
    const g = genre.toLowerCase();
    if (g.includes("romance")) return "Heart";
    if (g.includes("science fiction") || g.includes("sci-fi")) return "Rocket";
    if (g.includes("picture")) return "Image";
    if (g.includes("classic")) return "BookOpen";
    if (g.includes("mystery") || g.includes("thriller")) return "ShieldAlert";
    if (g.includes("history") || g.includes("historical")) return "Hourglass";
    if (g.includes("fantasy")) return "Wand2";
    if (g.includes("biography") || g.includes("memoir")) return "User";
    if (g.includes("self") || g.includes("improvement") || g.includes("motivation")) return "Zap";
    if (g.includes("children")) return "Baby";
    if (g.includes("young adult") || g.includes("ya")) return "Sparkles";
    return "Book";
  };

  // Map API genres to Category format
  const categories: Category[] = genreStats
    .filter((g: any) => g.genre && g.genre.trim() !== "")
    .map((g: any, index: number) => ({
      id: `cat-api-${index}`,
      name: g.genre,
      slug: slugify(g.genre),
      bookCount: g.count || 0,
      colorClass: "", // Dynamically managed by the CategoryCard's hash color picker
      iconName: getIconForGenre(g.genre),
    }));

  // Filter categories based on search input
  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Header Section */}
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 font-display">
          <Grid className="h-7 w-7 text-blue-600 shrink-0" />
          <span>Book Categories</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Explore and filter our collection of digital books by genre category
        </p>
      </div>

      {/* Control / Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 transition-colors">
        {/* Category Search bar */}
        <div className="relative w-full md:max-w-md flex items-center">
          <Search className="h-4.5 w-4.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="search"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-sm focus:border-blue-600 focus:bg-white placeholder:text-slate-400 text-slate-900 dark:text-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:focus:bg-slate-900 transition-all"
          />
        </div>

        {/* Sync loading status */}
        {isFetching && (
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold animate-pulse">
            <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin dark:border-blue-400" />
            <span>Updating categories...</span>
          </div>
        )}
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 animate-pulse"
            >
              <div className="p-6 rounded-2xl bg-slate-100 dark:bg-slate-800 h-12 w-12 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 bg-slate-100 dark:bg-slate-800 rounded" />
                <div className="h-3 w-16 bg-slate-50 dark:bg-slate-850 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-100/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 text-center">
          <RefreshCw className="h-10 w-10 text-slate-350 dark:text-slate-600 mb-3 animate-spin duration-3000" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200 text-base">No categories found</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
            Try adjusting your search criteria or clear your current query filter.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:hover:bg-blue-950/80 transition-colors"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
}
