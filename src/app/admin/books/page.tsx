"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getBooks, getGenreStats, BukuAcakBook } from "@/src/services/api/books";
import { TableSkeleton } from "@/src/components/shared/skeletons";

export default function AdminBooksPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setCurrentPage(1); // Reset page on new search
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter]);

  // Fetch genre stats for the filter dropdown
  const { data: genreStatsRaw } = useQuery({
    queryKey: ["genre-stats"],
    queryFn: () => getGenreStats(),
  });

  const genreStats: any[] = Array.isArray(genreStatsRaw)
    ? genreStatsRaw
    : (genreStatsRaw as any)?.genre_statistics || [];

  const genreList = genreStats
    .filter((g: any) => g.genre && g.genre.trim() !== "")
    .map((g: any) => g.genre);

  // Fetch books from BukuAcak API
  const { data: booksData, isLoading, isFetching } = useQuery({
    queryKey: ["admin-books", debouncedQuery, categoryFilter, currentPage],
    queryFn: () =>
      getBooks({
        keyword: debouncedQuery || undefined,
        genre: categoryFilter === "all" ? undefined : categoryFilter,
        page: currentPage,
      }),
  });

  const booksList: BukuAcakBook[] = booksData?.books || [];
  const pagination = booksData?.pagination;
  const totalPages = pagination?.total_pages || 1;
  const totalBooks = pagination?.total_books || 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 font-display">
          Books Catalog Dashboard
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          View, search, and monitor spec details of the Gramedia book catalog
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 transition-colors">
        {/* Search input field */}
        <div className="relative w-full md:max-w-md flex items-center">
          <Search className="h-4.5 w-4.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="search"
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-sm focus:border-blue-600 focus:bg-white placeholder:text-slate-400 text-slate-900 dark:text-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:focus:bg-slate-900 transition-all"
          />
        </div>

        {/* Filters and Loading Status */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {isFetching && (
            <span className="text-xs text-blue-600 dark:text-blue-450 animate-pulse font-semibold">
              Syncing catalog...
            </span>
          )}
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 md:flex-initial border border-slate-200 rounded-xl py-2 px-3 text-xs bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {genreList.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Books Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm dark:bg-slate-900 dark:border-slate-800 overflow-hidden transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] md:text-xs">
                  <th className="p-4 font-semibold">Cover & Title</th>
                  <th className="p-4 font-semibold">Author</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Publisher</th>
                  <th className="p-4 font-semibold">ISBN-13</th>
                  <th className="p-4 font-semibold">Pages</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                {booksList.length > 0 ? (
                  booksList.map((book) => {
                    const isbnVal = book.details?.isbn;
                    const hasIsbn = isbnVal && isbnVal !== "0";

                    return (
                      <tr
                        key={book._id}
                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
                      >
                        {/* Title & Cover */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={book.cover_image}
                              alt={book.title}
                              className="h-10 w-7 rounded object-cover shadow-xs"
                            />
                            <div className="font-bold text-slate-850 dark:text-slate-200 max-w-[220px] md:max-w-[300px] truncate">
                              {book.title}
                            </div>
                          </div>
                        </td>

                        {/* Author */}
                        <td className="p-4 font-semibold text-slate-650 dark:text-slate-400">
                          {book.author?.name || "Unknown Author"}
                        </td>

                        {/* Category */}
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {book.category?.name || "General"}
                          </span>
                        </td>

                        {/* Publisher */}
                        <td className="p-4 font-semibold text-slate-500 dark:text-slate-400">
                          {book.publisher || "Gramedia Press"}
                        </td>

                        {/* ISBN */}
                        <td className="p-4 font-mono font-semibold text-slate-600 dark:text-slate-400">
                          {hasIsbn ? isbnVal : "-"}
                        </td>

                        {/* Pages */}
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-350">
                          {book.details?.total_pages || "-"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-slate-400 font-semibold"
                    >
                      No books matched your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold">
                Showing {Math.min(totalBooks, (currentPage - 1) * 10 + 1)}-
                {Math.min(totalBooks, currentPage * 10)} of{" "}
                {totalBooks.toLocaleString()} books
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isFetching}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages || isFetching}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
