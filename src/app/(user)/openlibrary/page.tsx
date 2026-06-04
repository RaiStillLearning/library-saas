"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BookOpen, Search, Filter, ChevronLeft, ChevronRight,
  Globe, Loader2, AlertCircle, X, Sparkles
} from "lucide-react";
import Link from "next/link";
import {
  searchOpenLibrary,
  getCoverUrl,
  extractWorkId,
  getAvailabilityFromDoc,
  OLSearchDoc,
  OLSearchType,
} from "@/src/services/api/openlibrary";

const SUBJECTS = [
  { label: "Science", value: "science" },
  { label: "History", value: "history" },
  { label: "Philosophy", value: "philosophy" },
  { label: "Classic Literature", value: "classic literature" },
  { label: "Fiction", value: "fiction" },
  { label: "Mathematics", value: "mathematics" },
  { label: "Psychology", value: "psychology" },
  { label: "Biography", value: "biography" },
  { label: "Technology", value: "technology" },
  { label: "Art", value: "art" },
];

const AVAILABILITY_CONFIG = {
  readable: { label: "Free Online", className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  preview: { label: "Preview", className: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  borrow_required: { label: "Borrow", className: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  unavailable: { label: "Info Only", className: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
};

function SearchResultCard({ doc }: { doc: OLSearchDoc }) {
  const workId = extractWorkId(doc.key);
  const coverUrl = getCoverUrl(doc.cover_i, "M");
  const author = doc.author_name?.[0] || "Unknown Author";
  const availability = getAvailabilityFromDoc(doc);
  const badge = AVAILABILITY_CONFIG[availability];

  return (
    <Link
      href={`/openlibrary/${workId}`}
      className="group flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:border-violet-200 dark:hover:border-violet-800/40 transition-all duration-200"
    >
      {/* Cover */}
      <div className="relative h-52 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 flex items-center justify-center overflow-hidden shrink-0">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={doc.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <BookOpen className="h-10 w-10 text-violet-300 dark:text-violet-700" />
            <span className="text-xs font-medium text-violet-400 line-clamp-2">{doc.title}</span>
          </div>
        )}
        {/* Availability badge */}
        <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
          {doc.title}
        </h3>
        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{author}</p>
        <div className="mt-auto pt-2 flex items-center justify-between">
          {doc.first_publish_year && (
            <span className="text-[10px] text-slate-400">{doc.first_publish_year}</span>
          )}
          {doc.edition_count && (
            <span className="text-[10px] text-slate-400">{doc.edition_count} editions</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="h-52 bg-slate-100 dark:bg-slate-800" />
      <div className="p-4 space-y-2">
        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
      </div>
    </div>
  );
}

function OpenLibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [searchType, setSearchType] = useState<OLSearchType>(
    (searchParams.get("type") as OLSearchType) || "q"
  );
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [results, setResults] = useState<OLSearchDoc[]>([]);
  const [totalFound, setTotalFound] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const LIMIT = 12;
  const totalPages = Math.ceil(totalFound / LIMIT);

  const doSearch = useCallback(
    async (q: string, type: OLSearchType, p: number) => {
      if (!q.trim()) return;
      setIsLoading(true);
      setError(null);
      setHasSearched(true);
      try {
        const data = await searchOpenLibrary(q.trim(), p, type, LIMIT);
        setResults(data.docs);
        setTotalFound(data.numFound);
      } catch (err: any) {
        setError(err.message || "Failed to search OpenLibrary. Please try again.");
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Run search on mount if ?q= present
  useEffect(() => {
    const q = searchParams.get("q");
    const type = (searchParams.get("type") as OLSearchType) || "q";
    const p = Number(searchParams.get("page")) || 1;
    if (q) {
      setQuery(q);
      setSearchType(type);
      setPage(p);
      doSearch(q, type, p);
    }
  }, [searchParams, doSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setPage(1);
    router.push(`/openlibrary?q=${encodeURIComponent(query.trim())}&type=${searchType}&page=1`);
    doSearch(query.trim(), searchType, 1);
  };

  const handleSubject = (subject: string) => {
    setQuery(subject);
    setSearchType("subject");
    setPage(1);
    router.push(`/openlibrary?q=${encodeURIComponent(subject)}&type=subject&page=1`);
    doSearch(subject, "subject", 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    router.push(`/openlibrary?q=${encodeURIComponent(query)}&type=${searchType}&page=${newPage}`);
    doSearch(query, searchType, newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 font-display">
          <Globe className="h-7 w-7 text-violet-600 shrink-0" />
          <span>OpenLibrary</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Search and read millions of free books from the Open Library collection
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 rounded-3xl border border-violet-100 dark:border-violet-900/30 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search type tabs */}
          <div className="flex gap-2 flex-wrap">
            {(["q", "title", "author", "subject"] as OLSearchType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSearchType(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  searchType === type
                    ? "bg-violet-600 text-white shadow-sm"
                    : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 hover:text-violet-600 border border-slate-200 dark:border-slate-700"
                }`}
              >
                {type === "q" ? "All Fields" : type}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="flex items-center bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-4 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={
                  searchType === "author" ? "Search by author name..."
                  : searchType === "title" ? "Search by book title..."
                  : searchType === "subject" ? "Search by subject..."
                  : "Search books, authors, subjects..."
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full py-3.5 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-200 outline-none bg-transparent placeholder:text-slate-400"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="m-1.5 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Search
            </button>
          </div>
        </form>

        {/* Subject chips */}
        {!hasSearched && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Popular Subjects
            </p>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleSubject(s.value)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-800/40 text-violet-700 dark:text-violet-400 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all cursor-pointer"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!isLoading && hasSearched && !error && (
        <>
          {/* Result count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {totalFound > 0 ? (
                <>
                  <strong className="text-slate-800 dark:text-slate-200">{totalFound.toLocaleString()}</strong>{" "}
                  results for <strong className="text-violet-600">&ldquo;{query}&rdquo;</strong>
                </>
              ) : (
                "No results found"
              )}
            </p>
            {totalPages > 1 && (
              <span className="text-xs text-slate-400">
                Page {page} of {totalPages}
              </span>
            )}
          </div>

          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="p-5 bg-violet-50 dark:bg-violet-950/30 rounded-2xl">
                <BookOpen className="h-10 w-10 text-violet-300" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700 dark:text-slate-300">No books found</p>
                <p className="text-sm text-slate-400 mt-1">
                  Try a different search term, or browse popular subjects above.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {results.map((doc) => (
                  <SearchResultCard key={doc.key} doc={doc} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" /> Previous
                  </button>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300 px-4 py-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700">
                    {page} / {Math.min(totalPages, 100)}
                  </span>
                  <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page >= Math.min(totalPages, 100)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Initial state (no search yet) */}
      {!hasSearched && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="p-5 bg-violet-50 dark:bg-violet-950/30 rounded-2xl">
            <Globe className="h-10 w-10 text-violet-400" />
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-300">Explore OpenLibrary</p>
            <p className="text-sm text-slate-400 mt-1">
              Search millions of books or pick a subject above to get started.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OpenLibraryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    }>
      <OpenLibraryContent />
    </Suspense>
  );
}
