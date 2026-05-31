"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, Search, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getBooks, getGenreStats, BukuAcakBook } from "@/src/services/api/books";
import { BookCard, mapApiBookToCard } from "@/src/components/books/book-card";
import { cn } from "@/src/lib/utils";
import { BookGridSkeleton } from "@/src/components/shared/skeletons";
import { EmptyState } from "@/src/components/shared/empty-state";

function DiscoverContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial values from URL query parameters
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  // State managers
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Synchronize state with query parameters if they change externally
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setSelectedCategory(searchParams.get("category") || "all");
    setCurrentPage(parseInt(searchParams.get("page") || "1", 10));
  }, [searchParams]);

  // Fetch genre stats for category pills
  const { data: genreStatsRaw } = useQuery({
    queryKey: ["genre-stats"],
    queryFn: () => getGenreStats(),
    staleTime: 10 * 60 * 1000,
  });

  // Build category filters from real genre stats
  const genreStats: any[] = Array.isArray(genreStatsRaw)
    ? genreStatsRaw
    : (genreStatsRaw as any)?.genre_statistics || [];

  const categoryFilters = [
    { name: "All", slug: "all", genre: "" },
    ...genreStats
      .filter((g: any) => g.genre && g.genre.trim() !== "")
      .slice(0, 15)
      .map((g: any) => ({
        name: g.genre,
        slug: g.genre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, ""),
        genre: g.genre,
      })),
  ];

  // Find the actual genre name for the API call
  const selectedGenre =
    selectedCategory === "all"
      ? ""
      : categoryFilters.find((c) => c.slug === selectedCategory)?.genre || "";

  // Fetch books from API
  const {
    data: booksData,
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: ["discover-books", debouncedQuery, selectedGenre, currentPage],
    queryFn: () =>
      getBooks({
        keyword: debouncedQuery || undefined,
        genre: selectedGenre || undefined,
        page: currentPage,
      }),
    staleTime: 3 * 60 * 1000,
  });

  const books = booksData?.books || [];
  const pagination = booksData?.pagination;
  const totalPages = pagination?.total_pages || 1;
  const totalBooks = pagination?.total_books || 0;

  // Helper: update url params
  const updateUrlParams = useCallback(
    (query: string, category: string, page: number) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (category && category !== "all") params.set("category", category);
      if (page > 1) params.set("page", String(page));

      const paramsString = params.toString();
      router.push(`/discover${paramsString ? `?${paramsString}` : ""}`);
    },
    [router]
  );

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    updateUrlParams(val, selectedCategory, 1);
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    setCurrentPage(1);
    updateUrlParams(searchQuery, slug, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateUrlParams(searchQuery, selectedCategory, page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Discover Books</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Browse our complete collection of {totalBooks > 0 ? `${totalBooks.toLocaleString()} ` : ""}digital books
        </p>
      </div>

      {/* Control bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 transition-colors">
        {/* Search input field */}
        <div className="relative w-full md:max-w-md flex items-center">
          <Search className="h-4.5 w-4.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="search"
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-sm focus:border-blue-600 focus:bg-white placeholder:text-slate-400 text-slate-900 dark:text-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:focus:bg-slate-900 transition-all"
          />
        </div>

        {/* Loading indicator */}
        {isFetching && (
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold">
            <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </div>
        )}
      </div>

      {/* Category Pills selection list */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Categories:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categoryFilters.map((cat) => {
            const isActive = selectedCategory === cat.slug;
            return (
              <button
                key={cat.slug}
                onClick={() => handleCategorySelect(cat.slug)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                  isActive
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results details */}
      <div className="flex items-center justify-between pt-4">
        <span className="text-xs md:text-sm font-semibold text-slate-400">
          {isLoading
            ? "Loading books..."
            : `Showing ${books.length} of ${totalBooks} results`}
        </span>
        {pagination && totalPages > 1 && (
          <span className="text-xs font-semibold text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Book Grid */}
      {isLoading ? (
        <BookGridSkeleton count={10} />
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {books.map((book: BukuAcakBook) => (
            <BookCard key={book._id} book={mapApiBookToCard(book)} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={RefreshCw}
          title="No books found"
          description="Try adjusting your keyword search or selecting another category."
          actionText="Clear All Filters"
          onAction={() => {
            setSearchQuery("");
            setSelectedCategory("all");
            setCurrentPage(1);
            updateUrlParams("", "all", 1);
          }}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={cn(
              "px-4 py-2 border rounded-xl text-xs font-bold transition-colors cursor-pointer",
              currentPage <= 1
                ? "border-slate-100 text-slate-300 cursor-not-allowed dark:border-slate-800 dark:text-slate-600"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
            )}
          >
            Previous
          </button>

          {/* Page number buttons */}
          {(() => {
            const pageNumbers: number[] = [];
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, currentPage + 2);
            for (let i = startPage; i <= endPage; i++) {
              pageNumbers.push(i);
            }
            return pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={cn(
                  "w-10 h-10 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  page === currentPage
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                )}
              >
                {page}
              </button>
            ));
          })()}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={cn(
              "px-4 py-2 border rounded-xl text-xs font-bold transition-colors cursor-pointer",
              currentPage >= totalPages
                ? "border-slate-100 text-slate-300 cursor-not-allowed dark:border-slate-800 dark:text-slate-600"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
            )}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 pb-16">
          <div className="flex flex-col space-y-1.5 animate-pulse">
            <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-4 w-72 rounded bg-slate-100 dark:bg-slate-850" />
          </div>
          <BookGridSkeleton count={10} />
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
