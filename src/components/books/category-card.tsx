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

  // Split class name for text/bg colors based on category slug
  const getIconColorClasses = (slug: string) => {
    switch (slug) {
      case "science-fiction":
        return "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400";
      case "romance":
        return "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400";
      case "business":
        return "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400";
      case "education":
        return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400";
      case "fiction":
        return "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400";
      case "technology":
        return "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400";
      default:
        return "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <Link
      href={`/discover?category=${category.slug}`}
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
