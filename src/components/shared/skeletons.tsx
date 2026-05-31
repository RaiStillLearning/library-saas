import React from "react";
import { Skeleton } from "@/src/components/ui/skeleton";

export function BookCardSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-4 p-4">
      {/* Cover Image Placeholder */}
      <Skeleton className="relative aspect-[3/4] w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
      
      {/* Info Block Placeholders */}
      <div className="space-y-2">
        <Skeleton className="h-4.5 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-3.5 w-1/2 rounded bg-slate-100 dark:bg-slate-800/80" />
      </div>

      {/* Button Placeholder */}
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 flex-1 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
        <Skeleton className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800/60" />
      </div>
    </div>
  );
}

export function BookGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {Array.from({ length: count }).map((_, idx) => (
        <BookCardSkeleton key={idx} />
      ))}
    </div>
  );
}

export function BookDetailSkeleton() {
  return (
    <div className="space-y-10 pb-20 max-w-5xl mx-auto animate-pulse">
      {/* Back Button Placeholder */}
      <Skeleton className="h-5 w-32 rounded-lg bg-slate-200 dark:bg-slate-800" />

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Cover & Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex justify-center">
            <Skeleton className="aspect-[3/4] w-full max-w-[260px] rounded-2xl bg-slate-100 dark:bg-slate-800" />
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-3">
            <Skeleton className="h-12 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-800/80" />
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-3">
            <Skeleton className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-800/80" />
          </div>
        </div>

        {/* Right Side: Information */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-8 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-4 w-1/3 rounded bg-slate-100 dark:bg-slate-800/80" />
            </div>

            <div className="flex gap-4 py-4 border-y border-slate-100 dark:border-slate-800">
              <Skeleton className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-5 w-20 rounded bg-slate-100 dark:bg-slate-800/80" />
            </div>

            <div className="space-y-3">
              <Skeleton className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-800" />
              <Skeleton className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
              <Skeleton className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800/60" />
              <Skeleton className="h-4 w-5/6 rounded bg-slate-100 dark:bg-slate-800/60" />
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100/50 dark:border-slate-800 flex gap-3">
              <Skeleton className="h-5 w-5 rounded bg-slate-200 dark:bg-slate-800 shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-3 w-5/6 rounded bg-slate-100 dark:bg-slate-800/80" />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Skeleton className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                    <Skeleton className="h-4 w-20 rounded bg-slate-100 dark:bg-slate-800/80" />
                    <Skeleton className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full bg-white rounded-3xl border border-slate-100 shadow-xs dark:bg-slate-900 dark:border-slate-800 overflow-hidden animate-pulse">
      {/* Table Header Placeholder */}
      <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4">
        {Array.from({ length: cols }).map((_, idx) => (
          <Skeleton key={idx} className="h-4.5 flex-1 rounded bg-slate-200 dark:bg-slate-800 mx-2" />
        ))}
      </div>

      {/* Table Body Placeholder */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex p-4 items-center">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <Skeleton key={colIdx} className="h-4 flex-1 rounded bg-slate-100 dark:bg-slate-800/80 mx-2" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
