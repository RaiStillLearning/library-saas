"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Clock, TrendingUp, BookOpen, Search, ArrowRight } from "lucide-react";
import { MOCK_BOOKS, MOCK_CATEGORIES } from "@/src/lib/constants";
import { BookCard } from "@/src/components/books/book-card";
import { CategoryCard } from "@/src/components/books/category-card";
import Link from "next/link";

export default function UserHomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Filter books by status/types for sections
  const continueReadingBooks = MOCK_BOOKS.filter((b) => b.status === "Reading");
  const featuredBooks = MOCK_BOOKS.filter((b) => b.id === "book-3" || b.id === "book-4" || b.id === "book-5" || b.id === "book-6");
  const trendingBooks = MOCK_BOOKS.filter((b) => b.id === "book-7" || b.id === "book-8" || b.id === "book-9" || b.id === "book-10");

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

      {/* 2. Continue Reading Section */}
      {continueReadingBooks.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
                <Clock className="h-5 w-5" />
              </div>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50">Continue Reading</h2>
            </div>
            <Link href="/library" className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {continueReadingBooks.map((book) => (
              <BookCard key={book.id} book={book} showProgress />
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

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {featuredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* 4. Trending Now Section */}
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

        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {trendingBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      </section>

      {/* 5. Popular Categories Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
              <BookOpen className="h-5 w-5" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50">Popular Categories</h2>
          </div>
          <Link href="/categories" className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_CATEGORIES.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>
    </div>
  );
}
