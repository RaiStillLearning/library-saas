"use client";

import React from "react";
import { Book } from "@/src/lib/constants";
import { BukuAcakBook } from "@/src/services/api/books";
import { Star } from "lucide-react";
import Link from "next/link";

interface BookCardProps {
  book: Book;
}

// Helper to map BukuAcakBook -> Book interface for BookCard
export function mapApiBookToCard(apiBook: BukuAcakBook): Book {
  return {
    id: apiBook._id,
    title: apiBook.title,
    author: apiBook.author?.name || "Unknown Author",
    description: apiBook.summary || "",
    coverUrl:
      apiBook.cover_image ||
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&h=900&fit=crop",
    category: apiBook.category?.name || "General",
    stock: 5,
    availableStock: 5,
    rating: 4.5,
    status: "Available",
  };
}

export function BookCard({ book }: BookCardProps) {
  return (
    <Link href={`/books/${book.id}`} className="group block focus:outline-none">
      <div className="flex flex-col bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full dark:bg-slate-900 dark:border-slate-800">
        {/* Cover Image Container */}
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Category Badge - Overlaid Top Right */}
          <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-semibold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm border border-slate-100/50 dark:border-slate-800/50 backdrop-blur-xs">
            {book.category}
          </span>
        </div>

        {/* Book Details */}
        <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
              {book.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
              {book.author}
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/50">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {book.rating.toFixed(1)}
              </span>
            </div>

            {/* Availability */}
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Available
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
