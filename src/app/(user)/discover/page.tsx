"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SlidersHorizontal, Search, RefreshCw } from "lucide-react";
import { MOCK_BOOKS } from "@/src/lib/constants";
import { BookCard } from "@/src/components/books/book-card";
import { cn } from "@/src/lib/utils";
import { BookGridSkeleton } from "@/src/components/shared/skeletons";
import { EmptyState } from "@/src/components/shared/empty-state";

// List of category pill options
const CATEGORY_FILTERS = [
  { name: "All", slug: "all" },
  { name: "Science Fiction", slug: "science-fiction" },
  { name: "Romance", slug: "romance" },
  { name: "Biography", slug: "biography" },
  { name: "Thriller", slug: "thriller" },
  { name: "Fiction", slug: "fiction" },
  { name: "History", slug: "history" },
  { name: "Self-Help", slug: "self-help" },
];

function DiscoverContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial values from URL query parameters
  const initialQuery = searchParams.get("q") || "";
  const initialCategory = searchParams.get("category") || "all";

  // State managers
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(10); // Simple load more pagination state

  // Synchronize state with query parameters if they change externally
  useEffect(() => {
    setSearchQuery(searchParams.get("q") || "");
    setSelectedCategory(searchParams.get("category") || "all");
  }, [searchParams]);

  // Helper: update url params
  const updateUrlParams = (query: string, category: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (category && category !== "all") params.set("category", category);
    
    const paramsString = params.toString();
    router.push(`/discover${paramsString ? `?${paramsString}` : ""}`);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    updateUrlParams(val, selectedCategory);
  };

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug);
    updateUrlParams(searchQuery, slug);
    setVisibleCount(10); // reset page count
  };

  // 1. Filter books based on criteria
  const filteredBooks = MOCK_BOOKS.filter((book) => {
    // Search query matches title or author case-insensitively
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.category.toLowerCase().includes(searchQuery.toLowerCase());

    // Category matches slug
    const matchesCategory =
      selectedCategory === "all" ||
      book.category.toLowerCase().replace(/\s+/g, "-") === selectedCategory;

    // Availability matches
    let matchesAvailability = true;
    if (availabilityFilter === "available") {
      matchesAvailability = book.availableStock > 0;
    } else if (availabilityFilter === "borrowed") {
      matchesAvailability = book.status === "Borrowed";
    } else if (availabilityFilter === "reading") {
      matchesAvailability = book.status === "Reading";
    }

    return matchesSearch && matchesCategory && matchesAvailability;
  });

  // 2. Sort books
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortOrder === "rating") {
      return b.rating - a.rating;
    }
    if (sortOrder === "title-asc") {
      return a.title.localeCompare(b.title);
    }
    if (sortOrder === "title-desc") {
      return b.title.localeCompare(a.title);
    }
    // "newest" or default order
    return 0; // keeps mock database sequence
  });

  // Page sliced list
  const paginatedBooks = sortedBooks.slice(0, visibleCount);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Discover Books</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Browse our complete collection of digital books
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

        {/* Filters and sorting */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Availability Filter dropdown */}
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="flex-1 md:flex-initial border border-slate-200 rounded-xl py-2 px-3 text-xs bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="all">All Availability</option>
            <option value="available">Available</option>
            <option value="borrowed">Borrowed</option>
            <option value="reading">Currently Reading</option>
          </select>

          {/* Sort order dropdown */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="flex-1 md:flex-initial border border-slate-200 rounded-xl py-2 px-3 text-xs bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="rating">Highest Rating</option>
            <option value="title-asc">Title: A - Z</option>
            <option value="title-desc">Title: Z - A</option>
          </select>

          {/* Toggle filter drawer button */}
          <button className="p-2 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <SlidersHorizontal className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Category Pills selection list */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Categories:
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((cat) => {
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
          Showing {paginatedBooks.length} of {sortedBooks.length} results
        </span>
      </div>

      {/* Book Grid */}
      {paginatedBooks.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {paginatedBooks.map((book) => (
            <BookCard key={book.id} book={book} showProgress />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={RefreshCw}
          title="No books found"
          description="Try adjusting your keyword search, selecting another category, or changing the availability."
          actionText="Clear All Filters"
          onAction={() => {
            setSearchQuery("");
            setSelectedCategory("all");
            setAvailabilityFilter("all");
            updateUrlParams("", "all");
          }}
        />
      )}

      {/* Pagination Load More */}
      {visibleCount < sortedBooks.length && (
        <div className="flex justify-center pt-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className="px-6 py-3 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Load More Books
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
          <BookGridSkeleton count={8} />
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
