"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Search, Globe, BookMarked, Compass, Loader2,
  AlertCircle, ArrowRight, BookOpen, X,
} from "lucide-react";
import Link from "next/link";
import { searchOpenLibrary, getCoverUrl, extractWorkId, getAvailabilityFromDoc } from "@/src/services/api/openlibrary";
import { getBooks } from "@/src/services/api/books";
import { fetchReadSpaceBooks } from "@/src/services/supabase/db";

// ─── Domain badge ─────────────────────────────────────────────────────────────
function DomainBadge({ domain }: { domain: "gramedia" | "openlibrary" | "readspace" }) {
  const config = {
    gramedia: { label: "Gramedia", color: "bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400" },
    openlibrary: { label: "OpenLibrary", color: "bg-violet-100 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400" },
    readspace: { label: "ReadSpace Books", color: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400" },
  };
  const c = config[domain];
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.color}`}>
      {c.label}
    </span>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, count, color }: {
  icon: React.ElementType; title: string; count: number; color: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800`}>
      <div className={`p-1.5 rounded-lg bg-${color}-50 dark:bg-${color}-950/30`}>
        <Icon className={`h-4 w-4 text-${color}-600 dark:text-${color}-400`} />
      </div>
      <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</h2>
      <span className="text-xs text-slate-400 font-medium ml-auto">{count} results</span>
    </div>
  );
}

// ─── Result card ──────────────────────────────────────────────────────────────
function ResultCard({ href, cover, title, subtitle, badge, extra }: {
  href: string; cover?: string; title: string; subtitle?: string;
  badge: React.ReactNode; extra?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
    >
      <div className="w-10 h-14 shrink-0 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <BookOpen className="h-5 w-5 text-slate-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {title}
        </p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitle}</p>}
        <div className="flex items-center gap-2 mt-1">
          {badge}
          {extra && <span className="text-[10px] text-slate-400">{extra}</span>}
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
    </Link>
  );
}

function LoadingSection({ title }: { title: string }) {
  return (
    <div className="space-y-3">
      <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded animate-pulse w-48" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
          <div className="w-10 h-14 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function GlobalSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialQ = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQ);
  const [submitted, setSubmitted] = useState(initialQ);

  const [gramediaResults, setGramediaResults] = useState<any[]>([]);
  const [olResults, setOlResults] = useState<any[]>([]);
  const [rsResults, setRsResults] = useState<any[]>([]);

  const [loadingGramedia, setLoadingGramedia] = useState(false);
  const [loadingOl, setLoadingOl] = useState(false);
  const [loadingRs, setLoadingRs] = useState(false);

  const [errorGramedia, setErrorGramedia] = useState(false);
  const [errorOl, setErrorOl] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;

    setLoadingGramedia(true);
    setLoadingOl(true);
    setLoadingRs(true);
    setErrorGramedia(false);
    setErrorOl(false);

    // Gramedia
    getBooks({ keyword: q, page: 1 })
      .then((data) => setGramediaResults((data.books || []).slice(0, 5)))
      .catch(() => setErrorGramedia(true))
      .finally(() => setLoadingGramedia(false));

    // OpenLibrary
    searchOpenLibrary(q, 1, "q", 5)
      .then((data) => setOlResults(data.docs || []))
      .catch(() => setErrorOl(true))
      .finally(() => setLoadingOl(false));

    // ReadSpace Books (local filter — no extra API call needed)
    fetchReadSpaceBooks()
      .then((books) => {
        const lower = q.toLowerCase();
        setRsResults(
          books
            .filter((b) =>
              b.title.toLowerCase().includes(lower) ||
              b.author.toLowerCase().includes(lower)
            )
            .slice(0, 5)
        );
      })
      .catch(() => setRsResults([]))
      .finally(() => setLoadingRs(false));
  }, []);

  useEffect(() => {
    if (initialQ) runSearch(initialQ);
  }, [initialQ, runSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSubmitted(query.trim());
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    runSearch(query.trim());
  };

  const hasResults = gramediaResults.length > 0 || olResults.length > 0 || rsResults.length > 0;
  const isLoading = loadingGramedia || loadingOl || loadingRs;

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 font-display">
          <Search className="h-7 w-7 text-blue-600 shrink-0" />
          <span>Search</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Search across all ReadSpace sources — Gramedia, OpenLibrary, and internal library
        </p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden p-1.5">
        <div className="relative flex-1 flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search everything…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-200 bg-transparent outline-none placeholder:text-slate-400"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Search
        </button>
      </form>

      {/* Results */}
      {submitted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gramedia */}
          <div className="space-y-3">
            {loadingGramedia ? (
              <LoadingSection title="Gramedia" />
            ) : (
              <>
                <SectionHeader icon={Compass} title="Gramedia" count={gramediaResults.length} color="orange" />
                {errorGramedia && (
                  <div className="flex items-center gap-2 text-xs text-red-500 p-2">
                    <AlertCircle className="h-4 w-4" /> Gramedia unavailable
                  </div>
                )}
                {!errorGramedia && gramediaResults.length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center">No Gramedia results</p>
                )}
                {gramediaResults.map((book) => (
                  <ResultCard
                    key={book._id}
                    href={`/books/${book._id}`}
                    cover={book.cover_image}
                    title={book.title}
                    subtitle={book.author?.name}
                    badge={<DomainBadge domain="gramedia" />}
                    extra={book.category?.name}
                  />
                ))}
                {gramediaResults.length > 0 && (
                  <Link href={`/discover?q=${encodeURIComponent(submitted)}`} className="flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600 mt-1">
                    All Gramedia results <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </>
            )}
          </div>

          {/* OpenLibrary */}
          <div className="space-y-3">
            {loadingOl ? (
              <LoadingSection title="OpenLibrary" />
            ) : (
              <>
                <SectionHeader icon={Globe} title="OpenLibrary" count={olResults.length} color="violet" />
                {errorOl && (
                  <div className="flex items-center gap-2 text-xs text-red-500 p-2">
                    <AlertCircle className="h-4 w-4" /> OpenLibrary unavailable
                  </div>
                )}
                {!errorOl && olResults.length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center">No OpenLibrary results</p>
                )}
                {olResults.map((doc) => {
                  const workId = extractWorkId(doc.key);
                  const cover = doc.cover_i ? getCoverUrl(doc.cover_i, "S") : "";
                  return (
                    <ResultCard
                      key={doc.key}
                      href={`/openlibrary/${workId}`}
                      cover={cover}
                      title={doc.title}
                      subtitle={doc.author_name?.[0]}
                      badge={<DomainBadge domain="openlibrary" />}
                      extra={doc.first_publish_year ? String(doc.first_publish_year) : undefined}
                    />
                  );
                })}
                {olResults.length > 0 && (
                  <Link href={`/openlibrary?q=${encodeURIComponent(submitted)}`} className="flex items-center gap-1 text-xs font-semibold text-violet-500 hover:text-violet-600 mt-1">
                    All OpenLibrary results <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </>
            )}
          </div>

          {/* ReadSpace Books */}
          <div className="space-y-3">
            {loadingRs ? (
              <LoadingSection title="ReadSpace Books" />
            ) : (
              <>
                <SectionHeader icon={BookMarked} title="ReadSpace Books" count={rsResults.length} color="indigo" />
                {rsResults.length === 0 && (
                  <p className="text-xs text-slate-400 py-4 text-center">No ReadSpace Books results</p>
                )}
                {rsResults.map((book) => (
                  <ResultCard
                    key={book.id}
                    href="/readspace-books"
                    cover={book.cover_url}
                    title={book.title}
                    subtitle={book.author}
                    badge={<DomainBadge domain="readspace" />}
                    extra={book.available_stock > 0 ? `${book.available_stock} available` : "Out of stock"}
                  />
                ))}
                {rsResults.length > 0 && (
                  <Link href="/readspace-books" className="flex items-center gap-1 text-xs font-semibold text-indigo-500 hover:text-indigo-600 mt-1">
                    Browse all books <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!submitted && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="p-5 bg-blue-50 dark:bg-blue-950/30 rounded-2xl">
            <Search className="h-10 w-10 text-blue-400" />
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-300">Search everything</p>
            <p className="text-sm text-slate-400 mt-1">
              Type above to search Gramedia, OpenLibrary, and ReadSpace Books at once.
            </p>
          </div>
        </div>
      )}

      {/* No results */}
      {submitted && !isLoading && !hasResults && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl">
            <Search className="h-10 w-10 text-slate-400" />
          </div>
          <div>
            <p className="font-bold text-slate-700 dark:text-slate-300">No results found</p>
            <p className="text-sm text-slate-400 mt-1">
              Try a different search term or browse individual sections.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <GlobalSearchContent />
    </Suspense>
  );
}
