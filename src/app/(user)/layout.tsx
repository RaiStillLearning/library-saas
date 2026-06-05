"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import { UserSidebar } from "@/src/components/layout/user-sidebar";
import { TopBar } from "@/src/components/layout/top-bar";
import { BookOpen, Home, Compass, Globe, BookMarked, ListChecks, Library, History, User, Search } from "lucide-react";
import { ErrorBoundary } from "@/src/components/shared/error-boundary";
import { cn } from "@/src/lib/utils";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/src/components/ui/command";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Gramedia Discovery", href: "/discover", icon: Compass },
  { label: "OpenLibrary", href: "/openlibrary", icon: Globe },
  { label: "ReadSpace Books", href: "/readspace-books", icon: BookMarked },
  { label: "Reading Lists", href: "/reading-lists", icon: ListChecks },
  { label: "My Library", href: "/library", icon: Library },
  { label: "Borrow History", href: "/history", icon: History },
  { label: "Profile", href: "/profile", icon: User },
];

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const userEmail = profile?.email || user?.email || "";
  const isReadSpaceUser = userEmail.toLowerCase().endsWith("@readspace.co");

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  // Auto-close mobile sidebar drawer when switching pages
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const handleNavigate = useCallback((href: string) => {
    setCmdOpen(false);
    setSearchQuery("");
    router.push(href);
  }, [router]);

  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    setCmdOpen(false);
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
  }, [searchQuery, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <BookOpen className="h-12 w-12 text-blue-600 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Checking authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Overlay Background for mobile sidebar drawer */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation container with responsive translation */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:static lg:block transition-transform duration-300 lg:translate-x-0 shrink-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <UserSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main content pane */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <TopBar onMenuClick={() => setIsSidebarOpen(true)} onSearchClick={() => setCmdOpen(true)} />
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-slate-950 transition-colors p-6 md:p-8 relative">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* ── Command Palette (Ctrl+K) ─────────────────────────────────── */}
      <CommandDialog open={cmdOpen} onOpenChange={setCmdOpen}>
        <CommandInput
          placeholder="Search or navigate…"
          value={searchQuery}
          onValueChange={setSearchQuery}
          onKeyDown={(e) => {
            if (e.key === "Enter" && searchQuery.trim()) handleSearch();
          }}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          {/* Quick Search action */}
          {searchQuery.trim() && (
            <CommandGroup heading="Search">
              <CommandItem onSelect={handleSearch}>
                <Search className="mr-2 h-4 w-4 text-blue-500" />
                Search &ldquo;{searchQuery}&rdquo; across all sources
              </CommandItem>
            </CommandGroup>
          )}

          <CommandSeparator />

          {/* Navigation */}
          <CommandGroup heading="Navigate">
            {NAV_ITEMS.filter((item) => item.href !== "/readspace-books" || isReadSpaceUser).map((item) => (
              <CommandItem key={item.href} onSelect={() => handleNavigate(item.href)} value={item.label}>
                <item.icon className="mr-2 h-4 w-4 text-slate-400" />
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
}
