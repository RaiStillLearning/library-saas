"use client";

import React from "react";
import { Book } from "@/src/lib/constants";
import { Star, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/src/lib/utils";

interface BookCardProps {
  book: Book;
  showProgress?: boolean;
}

export function BookCard({ book, showProgress = false }: BookCardProps) {
  const isReading = book.status === "Reading" || (showProgress && book.progress !== undefined);

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

          {/* Borrowed overlay if borrowed */}
          {book.status === "Borrowed" && (
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center">
              <span className="px-3 py-1 bg-amber-500 text-white rounded-full text-xs font-semibold shadow-md animate-fade-in">
                Borrowed
              </span>
            </div>
          )}
        </div>

        {/* Book Details */}
        <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
          <div className="space-y-1.5">
            <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
              {book.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
              {book.author}
            </p>
          </div>

          {/* Reading Progress Indicator OR Rating / Status */}
          {isReading && book.progress !== undefined ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md dark:bg-blue-950/40 dark:text-blue-400">
                  Reading
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {book.progress}%
                </span>
              </div>
              {/* Progress track */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${book.progress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between pt-1 border-t border-slate-50 dark:border-slate-800/50">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-400" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {book.rating.toFixed(1)}
                </span>
              </div>

              {/* Stock / Availability Status */}
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  book.availableStock > 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-500 dark:text-rose-400"
                )}
              >
                {book.availableStock > 0 ? "Available" : "Out of Stock"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
