"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, TrendingUp, BookOpen, Search, ArrowRight, Loader2, Clock } from "lucide-react";
import { getBooks, getGenreStats, BukuAcakBook } from "@/src/services/api/books";
import { BookCard, mapApiBookToCard } from "@/src/components/books/book-card";
import { CategoryCard } from "@/src/components/books/category-card";
import { BookGridSkeleton } from "@/src/components/shared/skeletons";
import { fetchReadingHistory, ReadingHistoryEntry } from "@/src/services/supabase/db";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import Link from "next/link";

// Map genre stats from API into category card format
const GENRE_ICON_MAP: Record<string, string> = {
  "Picture Books": "Image",
  "Self-Improvement": "Brain",
  "Activity Books": "Puzzle",
  "Culinary": "CookingPot",
  "Literary": "BookText",
  "Romance": "Heart",
  "Harlequin": "HeartHandshake",
  "Mysteries & Thrillers": "Search",
  "Science Fiction & Fantasy": "Rocket",
  "Social Sciences": "Users",
  "Business Management & Leadership": "Briefcase",
  "Poetry": "Feather",
  "MetroPop": "Building2",
  "TeenLit": "Sparkle",
  "Young Adult": "GraduationCap",
  "Historical Romance": "Castle",
  "Religion & Spirituality": "Church",
  "Short Stories": "FileText",
  "Diet & Health": "Apple",
  "English Classics": "BookOpen",
  "Biography": "UserCircle",
  "Science & Nature": "Atom",
  "Parenting & Family": "Baby",
  "Historical Fiction": "Landmark",
  "Drama": "Drama",
  "Novel": "Book",
};

const GENRE_COLOR_MAP: Record<string, string> = {
  "Picture Books": "bg-pink-500 text-white dark:bg-pink-600",
  "Self-Improvement": "bg-emerald-500 text-white dark:bg-emerald-600",
  "Activity Books": "bg-yellow-500 text-white dark:bg-yellow-600",
  "Culinary": "bg-orange-500 text-white dark:bg-orange-600",
  "Literary": "bg-violet-500 text-white dark:bg-violet-600",
  "Romance": "bg-rose-500 text-white dark:bg-rose-600",
  "Mysteries & Thrillers": "bg-slate-700 text-white dark:bg-slate-600",
  "Science Fiction & Fantasy": "bg-blue-500 text-white dark:bg-blue-600",
  "Social Sciences": "bg-cyan-500 text-white dark:bg-cyan-600",
  "Business Management & Leadership": "bg-amber-500 text-white dark:bg-amber-600",
  "Poetry": "bg-indigo-500 text-white dark:bg-indigo-600",
  "MetroPop": "bg-fuchsia-500 text-white dark:bg-fuchsia-600",
};

export default function UserHomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { user, profile } = useAuth();
  const [recentlyOpened, setRecentlyOpened] = useState<ReadingHistoryEntry[]>([]);

  const userId = user?.id || profile?.id || "";

  useEffect(() => {
    if (!userId) return;
    fetchReadingHistory(userId).then((data) => setRecentlyOpened(data.slice(0, 6))).catch(() => {});
  }, [userId]);

  // Featured books - page 1
  const { data: featuredData, isLoading: isFeaturedLoading } = useQuery({
    queryKey: ["featured-books"],
    queryFn: () => getBooks({ page: 1 }),
    staleTime: 5 * 60 * 1000,
  });

  // Trending books - page 2
  const { data: trendingData, isLoading: isTrendingLoading } = useQuery({
    queryKey: ["trending-books"],
    queryFn: () => getBooks({ page: 2 }),
    staleTime: 5 * 60 * 1000,
  });

  // Genre stats for categories
  const { data: genreStatsRaw, isLoading: isGenreLoading } = useQuery({
    queryKey: ["genre-stats"],
    queryFn: () => getGenreStats(),
    staleTime: 10 * 60 * 1000,
  });

  const featuredBooks = (featuredData?.books || []).slice(0, 8);
  const trendingBooks = (trendingData?.books || []).slice(0, 8);

  // Transform genre stats into Category[] format
  const genreStats: any[] = Array.isArray(genreStatsRaw)
    ? genreStatsRaw
    : (genreStatsRaw as any)?.genre_statistics || [];

  const categories = genreStats
    .filter((g: any) => g.genre && g.genre.trim() !== "")
    .slice(0, 6)
    .map((g: any, idx: number) => ({
      id: `cat-${idx}`,
      name: g.genre,
      slug: g.genre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, ""),
      bookCount: g.count,
      colorClass:
        GENRE_COLOR_MAP[g.genre] || "bg-indigo-500 text-white dark:bg-indigo-600",
      iconName: GENRE_ICON_MAP[g.genre] || "BookOpen",
    }));

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero / Search Banner Section */}
      <section className="relative rounded-3xl bg-linear-to-br from-blue-50 to-indigo-50/50 p-8 md:p-12 dark:from-slate-900/60 dark:to-slate-800/40 border border-blue-100/50 dark:border-slate-800/60 overflow-hidden flex flex-col items-center text-center">
        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Small badge */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-100/60 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold mb-6">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Your Digital Library</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-slate-50 max-w-2xl leading-[1.15]">
          Discover Your Next <span className="text-[#5e52f3] dark:text-blue-400">Great Read</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-lg mt-4 font-medium leading-relaxed">
          Access thousands of books instantly. Read, learn, and grow with ReadSpace.
        </p>

        {/* Search Bar Form */}
        <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl mt-8 flex items-center bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-800">
          <div className="relative flex-1 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400 absolute left-3" />
            <input
              type="text"
              placeholder="Search for books, authors, or categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-10 pr-4 text-sm outline-none border-none bg-transparent placeholder:text-slate-400 text-slate-900 dark:text-slate-50"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-200 dark:shadow-none cursor-pointer"
          >
            Search
          </button>
        </form>
      </section>

      {/* 2. Recently Opened (OpenLibrary reading history) */}
      {recentlyOpened.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-violet-50 dark:bg-violet-950/40 rounded-xl text-violet-600 dark:text-violet-400">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50">Recently Opened</h2>
            </div>
            <Link href="/reading-lists" className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors">
              <span>Reading Lists</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
            {recentlyOpened.map((entry) => (
              <Link
                key={entry.work_id}
                href={`/openlibrary/read/${entry.work_id}`}
                className="group flex-shrink-0 w-36 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-md transition-all"
              >
                <div className="h-24 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 flex items-center justify-center overflow-hidden">
                  {entry.book_cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.book_cover} alt={entry.book_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <BookOpen className="h-8 w-8 text-violet-300" />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-2 leading-tight">{entry.book_title}</p>
                  <p className="text-[10px] text-violet-500 dark:text-violet-400 font-semibold mt-1.5">Open Again →</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 3. Featured Books Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <Sparkles className="h-5 w-5" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50">Featured Books</h2>
          </div>
          <Link href="/discover" className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isFeaturedLoading ? (
          <BookGridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book: BukuAcakBook) => (
              <BookCard key={book._id} book={mapApiBookToCard(book)} />
            ))}
          </div>
        )}
      </section>

      {/* 3. Trending Now Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50">Trending Now</h2>
          </div>
          <Link href="/discover" className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isTrendingLoading ? (
          <BookGridSkeleton count={8} />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {trendingBooks.map((book: BukuAcakBook) => (
              <BookCard key={book._id} book={mapApiBookToCard(book)} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Popular Categories Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50">Popular Categories</h2>
          </div>
          <Link href="/discover" className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {isGenreLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat: any) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
