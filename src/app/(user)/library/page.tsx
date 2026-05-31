"use client";

import React, { useState, useEffect } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  ClipboardList,
  Calendar,
  ArrowRight,
  Trash2,
  BookOpen,
  Info,
  Clock,
  ExternalLink,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { getBookById, BukuAcakBook } from "@/src/services/api/books";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/providers/supabase-provider";
import {
  fetchFavorites,
  removeFavorite,
  fetchBorrowings,
  returnBook,
} from "@/src/services/supabase/db";
import { BookGridSkeleton } from "@/src/components/shared/skeletons";
import { EmptyState } from "@/src/components/shared/empty-state";

export default function MyLibraryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"borrowed" | "saved">("borrowed");

  // State loaded from DB/localStorage
  const [borrowedList, setBorrowedList] = useState<any[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const [isLoadingBorrowed, setIsLoadingBorrowed] = useState(true);
  const [isLoadingSavedFromDb, setIsLoadingSavedFromDb] = useState(true);

  // Load lists from DB on mount
  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      try {
        setIsLoadingBorrowed(true);
        const borrowings = await fetchBorrowings(user.id);
        setBorrowedList(borrowings);
      } catch (e) {
        console.error("Failed to load borrowings:", e);
      } finally {
        setIsLoadingBorrowed(false);
      }

      try {
        setIsLoadingSavedFromDb(true);
        const favorites = await fetchFavorites(user.id);
        setSavedIds(favorites);
      } catch (e) {
        console.error("Failed to load favorites:", e);
      } finally {
        setIsLoadingSavedFromDb(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Fetch details for saved books
  const savedQueries = useQueries({
    queries: savedIds.map((id) => ({
      queryKey: ["bookDetail", id],
      queryFn: () => getBookById(id),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoadingSaved = isLoadingSavedFromDb || savedQueries.some((q) => q.isLoading);
  const savedBooks = savedQueries
    .map((q) => q.data)
    .filter((book): book is BukuAcakBook => !!book);

  // Return book handler
  const handleReturnBook = async (bookId: string) => {
    if (!user?.id) return;
    try {
      const success = await returnBook(user.id, bookId);
      if (success) {
        const updated = borrowedList.filter((b) => b.id !== bookId);
        setBorrowedList(updated);
        toast.success("Book returned successfully");
      } else {
        toast.error("Failed to return book");
      }
    } catch {
      toast.error("Failed to return book");
    }
  };

  // Remove saved book handler
  const handleRemoveSaved = async (bookId: string) => {
    if (!user?.id) return;
    try {
      const success = await removeFavorite(user.id, bookId);
      if (success) {
        const updated = savedIds.filter((id) => id !== bookId);
        setSavedIds(updated);
        toast.success("Removed from saved list");
      } else {
        toast.error("Failed to remove book");
      }
    } catch {
      toast.error("Failed to remove book");
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">My Library</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Manage your borrowed and saved books in one place
        </p>
      </div>

      {/* Custom Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("borrowed")}
          className={cn(
            "flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer",
            activeTab === "borrowed"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <ClipboardList className="h-4.5 w-4.5" />
          <span>Borrowed Books</span>
          {borrowedList.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-bold">
              {borrowedList.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={cn(
            "flex items-center gap-2 px-6 py-3 border-b-2 text-sm font-semibold transition-all cursor-pointer",
            activeTab === "saved"
              ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <Bookmark className="h-4.5 w-4.5" />
          <span>Saved Books</span>
          {savedIds.length > 0 && (
            <span className="ml-1.5 px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-bold">
              {savedIds.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === "borrowed" && (
        <div className="space-y-6">
          {isLoadingBorrowed ? (
            <BookGridSkeleton count={4} />
          ) : borrowedList.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No borrowed books"
              description="You haven't borrowed any books yet. Explore the collection to borrow your first book."
              actionText="Browse Books"
              onAction={() => router.push("/discover")}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {borrowedList.map((book) => {
                const dueDate = new Date(book.dueDate);
                const diffTime = dueDate.getTime() - new Date().getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isOverdue = diffDays < 0;

                return (
                  <div
                    key={book.id}
                    className="flex flex-col bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 dark:bg-slate-900 dark:border-slate-800"
                  >
                    {/* Cover Image */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-semibold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 rounded-lg shadow-xs border border-slate-100/50">
                        {book.category}
                      </span>
                    </div>

                    {/* Book Info */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-1">
                        <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm leading-snug truncate">
                          {book.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                          {book.author}
                        </p>
                      </div>

                      {/* Due Date Indicator */}
                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold",
                          isOverdue
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                            : "bg-slate-50 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400"
                        )}
                      >
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>
                          {isOverdue
                            ? `Overdue by ${Math.abs(diffDays)} days`
                            : `Due in ${diffDays} days`}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/books/${book.id}`)}
                          className="flex-1 h-9 border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => handleReturnBook(book.id)}
                          className="flex-1 h-9 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Return
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === "saved" && (
        <div className="space-y-6">
          {isLoadingSaved ? (
            <BookGridSkeleton count={4} />
          ) : savedBooks.length === 0 ? (
            <EmptyState
              icon={Bookmark}
              title="No saved books"
              description="You haven't saved any books yet. Save books for later by clicking the Bookmark icon on detail pages."
              actionText="Browse Books"
              onAction={() => router.push("/discover")}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {savedBooks.map((book) => (
                <div
                  key={book._id}
                  className="flex flex-col bg-white rounded-2xl border border-slate-100/80 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 dark:bg-slate-900 dark:border-slate-800"
                >
                  {/* Cover Image */}
                  <div className="relative aspect-[3/4] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={book.cover_image}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-semibold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 rounded-lg shadow-xs border border-slate-100/50">
                      {book.category.name}
                    </span>
                  </div>

                  {/* Book Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm leading-snug truncate">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                        {book.author.name}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/books/${book._id}`)}
                        className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleRemoveSaved(book._id)}
                        className="p-2 border border-slate-200 text-rose-500 hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-950/20 rounded-lg transition-all cursor-pointer"
                        title="Remove from saved"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
