"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, Book, Grid, Users, ClipboardList, BarChart3, LogOut, ArrowLeft, X } from "lucide-react";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import { cn } from "@/src/lib/utils";

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const menuItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "Books", href: "/admin/books", icon: Book },
    { name: "Categories", href: "/admin/categories", icon: Grid },
    { name: "Students", href: "/admin/students", icon: Users },
    { name: "Borrowings", href: "/admin/borrowings", icon: ClipboardList },
    { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  ];

  return (
    <aside className="w-64 border-r border-slate-100 bg-white h-screen flex flex-col justify-between p-6 dark:bg-slate-900 dark:border-slate-800 transition-colors">
      <div className="flex flex-col flex-1">
        {/* Branding Logo */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="p-2 bg-blue-600 rounded-xl group-hover:scale-105 transition-transform">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 dark:text-slate-50 leading-tight">ReadSpace</span>
              <span className="text-[10px] text-slate-400 font-medium">Admin Panel</span>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-650 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg lg:hidden cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>

        {/* Section Title */}
        <div className="px-3 mb-3">
          <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">
            Management
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-transform group-hover:scale-105",
                    isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Switch to User View + Logout + Footer */}
      <div className="space-y-2 pt-4 border-t border-slate-50 dark:border-slate-800">
        <Link
          href="/"
          className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-slate-400" />
          <span>User View</span>
        </Link>
        <button
          onClick={() => signOut()}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/20 dark:hover:text-red-400 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4 text-slate-400 group-hover:text-red-600" />
          <span>Sign Out</span>
        </button>
        <div className="text-[10px] text-slate-400 px-3 pt-2">
          &copy; 2026 ReadSpace
        </div>
      </div>
    </aside>
  );
}
