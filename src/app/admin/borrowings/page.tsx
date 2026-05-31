"use client";

import React, { useState, useEffect } from "react";
import { ClipboardList, Plus, Edit2, CheckCircle2, User, Mail, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { fetchAllBorrowingsAdmin, adminReturnBook } from "@/src/services/supabase/db";
import { TableSkeleton } from "@/src/components/shared/skeletons";
import { EmptyState } from "@/src/components/shared/empty-state";

export default function AdminBorrowingsPage() {
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const loadBorrowings = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllBorrowingsAdmin();
      setBorrowings(data);
    } catch (error) {
      console.error("Failed to load admin borrowings:", error);
      toast.error("Failed to fetch library borrowing logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBorrowings();
  }, []);

  const handleProcessBorrowing = () => {
    toast.info("Create borrowing request from the catalog page (student side).");
  };

  const handleMarkReturned = async (borrowingId: string, bookId: string) => {
    setIsProcessing(borrowingId);
    try {
      const success = await adminReturnBook(borrowingId, bookId);
      if (success) {
        toast.success("Marked book as returned successfully");
        loadBorrowings(); // Reload list
      } else {
        toast.error("Failed to update status to returned.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during updating status.");
    } finally {
      setIsProcessing(null);
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
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 font-display">
            <ClipboardList className="h-7 w-7 text-blue-600 shrink-0" />
            <span>Borrowings Management</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Manage borrowing request transactions, return items, and track logs
          </p>
        </div>
        <button
          onClick={handleProcessBorrowing}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Borrowing</span>
        </button>
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : borrowings.length > 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm dark:bg-slate-900 dark:border-slate-800 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] md:text-xs">
                  <th className="p-5 font-semibold">Student</th>
                  <th className="p-5 font-semibold">Book Title</th>
                  <th className="p-5 font-semibold">Borrow Date</th>
                  <th className="p-5 font-semibold">Due Date</th>
                  <th className="p-5 font-semibold">Status</th>
                  <th className="p-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                {borrowings.map((b) => {
                  const isActive = b.status === "Borrowed";
                  return (
                    <tr key={b.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                      {/* Student Info */}
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {b.studentName}
                          </span>
                          <span className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-450 shrink-0" />
                            {b.studentEmail}
                          </span>
                        </div>
                      </td>

                      {/* Book Details */}
                      <td className="p-5">
                        <span className="font-bold text-slate-700 dark:text-slate-350 line-clamp-1">
                          {b.title}
                        </span>
                      </td>

                      {/* Dates */}
                      <td className="p-5 text-slate-500 font-medium">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(b.borrowDate)}</span>
                        </div>
                      </td>
                      <td className="p-5 text-slate-500 font-medium">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{formatDate(b.dueDate)}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="p-5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] md:text-xs ${
                            b.status === "Returned"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : b.status === "Overdue"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2">
                          {isActive && (
                            <button
                              onClick={() => handleMarkReturned(b.id, b.bookId)}
                              disabled={isProcessing === b.id}
                              className="p-2 border border-emerald-150 text-emerald-600 hover:bg-emerald-50 rounded-xl dark:border-slate-800 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50 transition-all"
                              title="Mark as Returned"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => toast.info("Editing transaction detail is disabled.")}
                            className="p-2 border border-slate-150 hover:bg-slate-50 hover:text-blue-600 rounded-xl dark:border-slate-800 dark:hover:bg-slate-800 transition-all cursor-pointer"
                          >
                            <Edit2 className="h-4 w-4 text-slate-400" />
                          </button>
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
          icon={ClipboardList}
          title="No Borrowing Records"
          description="There are currently no books borrowed in ReadSpace. Active borrowings will show up here."
          actionText="Catalog Page"
          onAction={() => {
            window.location.href = "/";
          }}
        />
      )}
    </div>
  );
}
