"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import { fetchBorrowHistory, returnBook } from "@/src/services/supabase/db";
import { History, BookOpen, Clock, Calendar, CheckCircle, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { EmptyState } from "@/src/components/shared/empty-state";

export default function BorrowHistoryPage() {
  const { user } = useAuth();
  const [borrowHistory, setBorrowHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState<string | null>(null);

  const loadHistory = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const data = await fetchBorrowHistory(user.id);
      setBorrowHistory(data);
    } catch (error) {
      console.error("Failed to load borrow history:", error);
      toast.error("Failed to retrieve borrowing logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  const handleReturn = async (bookId: string) => {
    if (!user) return;
    setIsActioning(bookId);
    try {
      const success = await returnBook(user.id, bookId);
      if (success) {
        toast.success("Book returned successfully!");
        loadHistory();
      } else {
        toast.error("Failed to complete return request.");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred during returning.");
    } finally {
      setIsActioning(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Section */}
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 font-display">
          <History className="h-7 w-7 text-blue-600 shrink-0" />
          <span>Borrow History</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Track active book borrowings, view due dates, and explore logs of returned items
        </p>
      </div>

      {/* Main List Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-100/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 animate-pulse"
            >
              <div className="flex gap-4 items-center">
                <div className="h-16 w-12 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0" />
                <div className="space-y-2">
                  <div className="h-4 w-40 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-3.5 w-24 bg-slate-50 dark:bg-slate-850 rounded" />
                </div>
              </div>
              <div className="h-8 w-24 bg-slate-100 dark:bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      ) : borrowHistory.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-850 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] md:text-xs">
                  <th className="p-5 font-semibold">Book Details</th>
                  <th className="p-5 font-semibold">Borrow Date</th>
                  <th className="p-5 font-semibold">Due Date</th>
                  <th className="p-5 font-semibold">Return Date</th>
                  <th className="p-5 font-semibold">Status</th>
                  <th className="p-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                {borrowHistory.map((item) => {
                  const isActive = item.status === "Borrowed";
                  return (
                    <tr
                      key={`${item.id}-${item.borrowDate}`}
                      className="group hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors"
                    >
                      {/* Book Cover and Title */}
                      <td className="p-5">
                        <div className="flex items-center gap-4">
                          <div className="relative h-16 w-11 rounded-md overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-100 dark:border-slate-800">
                            {item.coverUrl ? (
                              <Image
                                src={item.coverUrl}
                                alt={item.title}
                                fill
                                sizes="44px"
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="h-4 w-4 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {item.title}
                            </span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">
                              by {item.author}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Borrow Date */}
                      <td className="p-5">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-450 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(item.borrowDate)}</span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="p-5">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-450 font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(item.dueDate)}</span>
                        </div>
                      </td>

                      {/* Return Date */}
                      <td className="p-5">
                        {item.returnDate ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-bold">
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>{formatDate(item.returnDate)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 font-medium">-</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="p-5">
                        <span
                          className={cn(
                            "px-2.5 py-0.5 rounded-full font-bold text-[10px] md:text-xs",
                            item.status === "Returned"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : item.status === "Overdue"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                          )}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {isActive ? (
                            <>
                              <button
                                onClick={() => handleReturn(item.id)}
                                disabled={isActioning !== null}
                                className="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-250 dark:hover:bg-slate-700/60 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                              >
                                {isActioning === item.id ? "Returning..." : "Return"}
                              </button>
                              <Link
                                href={`/reader/${item.id}`}
                                className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all shadow-xs"
                              >
                                Read
                              </Link>
                            </>
                          ) : (
                            <Link
                              href={`/books/${item.id}`}
                              className="px-3 py-1.5 text-xs font-bold border border-slate-100 hover:border-slate-200 dark:border-slate-800 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all"
                            >
                              Details
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ArrowLeftRight}
          title="No Borrowing Logs"
          description="You haven't borrowed any books yet. Borrow a book to begin your reading space journal."
          actionText="Discover Books"
          onAction={() => {
            window.location.href = "/discover";
          }}
        />
      )}
    </div>
  );
}
