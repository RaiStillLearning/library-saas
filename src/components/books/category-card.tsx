"use client";

import React from "react";
import { Category } from "@/src/lib/constants";
import * as Icons from "lucide-react";
import Link from "next/link";
import { cn } from "@/src/lib/utils";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  // Dynamically resolve Lucide Icon
  const IconComponent = (Icons as any)[category.iconName] || Icons.BookOpen;

  // Color palette for category icons - cycles through for any genre
  const colorPalette = [
    "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
    "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
    "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
    "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
    "bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400",
    "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950/40 dark:text-fuchsia-400",
    "bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
    "bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400",
  ];

  const getIconColorClasses = (slug: string) => {
    // Simple hash to consistently pick a color for any slug
    let hash = 0;
    for (let i = 0; i < slug.length; i++) {
      hash = slug.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colorPalette[Math.abs(hash) % colorPalette.length];
  };

  return (
    <Link
      href={`/discover?genre=${encodeURIComponent(category.name)}`}
      className="group block focus:outline-none"
    >
      <div className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-slate-100/80 shadow-xs hover:shadow-md hover:border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 transition-all duration-300">
        {/* Icon Container */}
        <div className={cn("p-3.5 rounded-2xl transition-transform group-hover:scale-105 duration-300", getIconColorClasses(category.slug))}>
          <IconComponent className="h-6 w-6" />
        </div>

        {/* Text Details */}
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-slate-50 text-sm md:text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
            {category.name}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
            {category.bookCount} books
          </span>
        </div>
      </div>
    </Link>
  );
}
