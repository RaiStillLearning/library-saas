"use client";

import React, { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, RefreshCw } from "lucide-react";
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
  const initialGenre = searchParams.get("genre") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  // State managers
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [accumulatedBooks, setAccumulatedBooks] = useState<BukuAcakBook[]>([]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page and accumulated books when search query or genre changes
  const [prevQuery, setPrevQuery] = useState(initialQuery);
  const [prevGenre, setPrevGenre] = useState(initialGenre);

  if (debouncedQuery !== prevQuery || selectedGenre !== prevGenre) {
    setPrevQuery(debouncedQuery);
    setPrevGenre(selectedGenre);
    setCurrentPage(1);
    setAccumulatedBooks([]);
  }

  // Synchronize state with query parameters if they change externally
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setSelectedGenre(searchParams.get("genre") || "");
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

  const genreList = genreStats
    .filter((g: any) => g.genre && g.genre.trim() !== "")
    .slice(0, 20);

  // Fetch books from API - uses exact genre name directly
  const {
    data: booksData,
    isLoading,
    isFetching,
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

  const pagination = booksData?.pagination;
  const totalPages = pagination?.total_pages || 1;
  const totalBooks = pagination?.total_books || 0;

  // Sync loaded books to accumulatedBooks
  useEffect(() => {
    if (booksData?.books) {
      if (currentPage === 1) {
        setAccumulatedBooks(booksData.books);
      } else {
        setAccumulatedBooks((prev) => {
          const existingIds = new Set(prev.map((b) => b._id));
          const newBooks = booksData.books.filter((b) => !existingIds.has(b._id));
          return [...prev, ...newBooks];
        });
      }
    }
  }, [booksData, currentPage]);

  // Helper: update url params
  const updateUrlParams = useCallback(
    (query: string, genre: string, page: number) => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (genre) params.set("genre", genre);
      if (page > 1) params.set("page", String(page));

      const paramsString = params.toString();
      router.push(`/discover${paramsString ? `?${paramsString}` : ""}`);
    },
    [router]
  );

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    setAccumulatedBooks([]);
    updateUrlParams(val, selectedGenre, 1);
  };

  const handleGenreSelect = (genre: string) => {
    const newGenre = genre === selectedGenre ? "" : genre; // Toggle off if already selected
    setSelectedGenre(newGenre);
    setCurrentPage(1);
    setAccumulatedBooks([]);
    updateUrlParams(searchQuery, newGenre, 1);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 font-display">
          {selectedGenre ? selectedGenre : "Discover Books"}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          {selectedGenre
            ? `Showing ${totalBooks.toLocaleString()} books in ${selectedGenre}`
            : `Browse our complete collection of ${totalBooks > 0 ? `${totalBooks.toLocaleString()} ` : ""}digital books`}
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
          <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold animate-pulse">
            <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin dark:border-blue-400" />
            <span>Syncing database...</span>
          </div>
        )}
      </div>

      {/* Category / Genre Pills */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Categories:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* All button */}
          <button
            onClick={() => handleGenreSelect("")}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
              !selectedGenre
                ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                : "bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            All
          </button>

          {genreList.map((g: any) => {
            const isActive = selectedGenre === g.genre;
            return (
              <button
                key={g.genre}
                onClick={() => handleGenreSelect(g.genre)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer",
                  isActive
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white border-slate-200/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {g.genre}
                <span className="ml-1 opacity-60">({g.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results details */}
      <div className="flex items-center justify-between pt-4">
        <span className="text-xs md:text-sm font-semibold text-slate-400">
          {isLoading && accumulatedBooks.length === 0
            ? "Loading books..."
            : `Showing ${accumulatedBooks.length} of ${totalBooks.toLocaleString()} results`}
        </span>
      </div>

      {/* Book Grid */}
      {isLoading && accumulatedBooks.length === 0 ? (
        <BookGridSkeleton count={10} />
      ) : accumulatedBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {accumulatedBooks.map((book: BukuAcakBook) => (
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
            setSelectedGenre("");
            setCurrentPage(1);
            setAccumulatedBooks([]);
            updateUrlParams("", "", 1);
          }}
        />
      )}

      {/* Load More Button */}
      {currentPage < totalPages && accumulatedBooks.length > 0 && (
        <div className="flex justify-center pt-10">
          <button
            onClick={() => {
              const nextPage = currentPage + 1;
              setCurrentPage(nextPage);
              updateUrlParams(searchQuery, selectedGenre, nextPage);
            }}
            disabled={isFetching}
            className={cn(
              "px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center gap-2 dark:bg-blue-500 dark:hover:bg-blue-600"
            )}
          >
            {isFetching ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Loading more books...</span>
              </>
            ) : (
              <span>Load More Books</span>
            )}
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
