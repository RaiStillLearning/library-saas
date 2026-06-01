"use client";

import React from "react";
import { Bell, Search, Menu } from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import Image from "next/image";
import { useTheme } from "@/src/providers/theme-provider";

interface TopBarProps {
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  onMenuClick?: () => void;
}

export function TopBar({
  onSearchChange,
  searchPlaceholder = "Search books, authors, categories...",
  onMenuClick,
}: TopBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-45 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white px-6 md:px-8 dark:bg-slate-900 dark:border-slate-800 transition-colors">
      {/* Menu burger on mobile */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="mr-3 p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer lg:hidden shrink-0"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      {/* Search Input Area */}
      <div className="relative flex flex-1 max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center pr-3">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        <input
          type="search"
          placeholder={searchPlaceholder}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-4 text-sm outline-none placeholder:text-slate-400 focus:border-blue-600 focus:bg-white dark:border-slate-700 dark:bg-slate-800/50 dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-slate-50"
        />
      </div>

      {/* Right Side Icons */}
      <div className="flex items-center gap-4 ml-4">
        {/* Notification Bell */}
        <button className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 transition-colors rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Theme Toggle Button replacing profile */}
        <button
          onClick={toggleTheme}
          className="relative focus:outline-none focus:ring-2 focus:ring-blue-500/40 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          <Image
            src={theme === "dark" ? "/logo/dark-mode.png" : "/logo/light-mode.png"}
            alt={`${theme === "dark" ? "Dark" : "Light"} Mode Toggle`}
            width={38}
            height={38}
            className="h-[38px] w-[38px] rounded-xl object-contain border border-slate-200 dark:border-slate-800"
            priority
          />
        </button>
      </div>
    </header>
  );
}
