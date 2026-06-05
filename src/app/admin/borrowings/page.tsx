"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  DollarSign,
  AlertCircle,
  HelpCircle,
  Loader2,
  Calendar,
  User,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAllReadSpaceBorrowingsAdmin,
  approveReadSpaceBorrowing,
  rejectReadSpaceBorrowing,
  adminReturnReadSpaceBook,
  payReadSpaceFine,
  ReadSpaceBorrowing,
} from "@/src/services/supabase/db";

type TabType = "pending" | "active" | "all";

export default function AdminBorrowingsPage() {
  const [borrowings, setBorrowings] = useState<ReadSpaceBorrowing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("pending");

  // Rejection modal state
  const [rejectingBorrowing, setRejectingBorrowing] = useState<ReadSpaceBorrowing | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Processing indicators
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadBorrowings = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllReadSpaceBorrowingsAdmin();
      setBorrowings(data);
    } catch (error) {
      console.error("Failed to load admin borrowings:", error);
      toast.error("Failed to fetch library borrowing logs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBorrowings();
  }, [loadBorrowings]);

  const handleApprove = async (b: ReadSpaceBorrowing) => {
    setProcessingId(b.id);
    try {
      const result = await approveReadSpaceBorrowing(b.id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      await loadBorrowings();
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during approval.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenReject = (b: ReadSpaceBorrowing) => {
    setRejectingBorrowing(b);
    setRejectionReason("");
  };

  const handleCloseReject = () => {
    setRejectingBorrowing(null);
    setRejectionReason("");
  };

  const handleRejectSubmit = async () => {
    if (!rejectingBorrowing) return;
    if (!rejectionReason.trim()) {
      toast.error("Rejection reason is required.");
      return;
    }
    setIsRejecting(true);
    try {
      const success = await rejectReadSpaceBorrowing(rejectingBorrowing.id, rejectionReason.trim());
      if (success) {
        toast.success("Request rejected successfully.");
        await loadBorrowings();
        handleCloseReject();
      } else {
        toast.error("Failed to reject request.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleReturn = async (b: ReadSpaceBorrowing) => {
    setProcessingId(b.id);
    try {
      const success = await adminReturnReadSpaceBook(b.id, b.book_id);
      if (success) {
        toast.success("Book returned. Stock restored successfully.");
        await loadBorrowings();
      } else {
        toast.error("Failed to process return.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred while returning.");
    } finally {
      setProcessingId(null);
    }
  };

  const handlePayFine = async (b: ReadSpaceBorrowing) => {
    setProcessingId(b.id);
    try {
      const success = await payReadSpaceFine(b.id);
      if (success) {
        toast.success("Fine marked as paid.");
        await loadBorrowings();
      } else {
        toast.error("Failed to clear fine.");
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred.");
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Filter borrowings based on active tab and search query
  const filteredBorrowings = borrowings.filter((b) => {
    // 1. Tab check
    if (activeTab === "pending" && b.status !== "pending") return false;
    if (activeTab === "active" && b.status !== "borrowed" && b.status !== "overdue") return false;

    // 2. Search check
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.borrow_code?.toLowerCase().includes(query) ||
      b.book?.title?.toLowerCase().includes(query) ||
      b.student_name?.toLowerCase().includes(query) ||
      b.student_email?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 font-display">
          <ClipboardList className="h-7 w-7 text-indigo-600 shrink-0" />
          <span>Borrowings Management</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Approve or reject requests, log returned books, track outstanding overdue fines, and audit transaction records.
        </p>
      </div>

      {/* Tabs & Search controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-2xl w-fit">
          {[
            { id: "pending", label: "Pending Requests" },
            { id: "active", label: "Active Loans" },
            { id: "all", label: "All Transactions" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            // Get counts
            let count = 0;
            if (tab.id === "pending") count = borrowings.filter((b) => b.status === "pending").length;
            if (tab.id === "active") count = borrowings.filter((b) => b.status === "borrowed" || b.status === "overdue").length;
            if (tab.id === "all") count = borrowings.length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-650"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 px-4 py-2.5 shadow-sm max-w-sm w-full">
          <Search className="h-4.5 w-4.5 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by code, title, student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs bg-transparent outline-none border-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Main Table Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <p className="text-xs font-semibold">Fetching transactions logs...</p>
        </div>
      ) : filteredBorrowings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl gap-2">
          <HelpCircle className="h-10 w-10 opacity-30 text-slate-400" />
          <p className="text-sm font-semibold">No borrowing requests found</p>
          <p className="text-xs text-slate-400 max-w-xs text-center font-medium">
            Try switching tabs or adjusting your search query.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px] md:text-xs bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="p-5 font-semibold">Transaction Code</th>
                  <th className="p-5 font-semibold">Student</th>
                  <th className="p-5 font-semibold">Book Details</th>
                  <th className="p-5 font-semibold">Dates</th>
                  <th className="p-5 font-semibold">Fines</th>
                  <th className="p-5 font-semibold">Status</th>
                  <th className="p-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                {filteredBorrowings.map((b) => {
                  return (
                    <tr
                      key={b.id}
                      className="group hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors"
                    >
                      {/* Code */}
                      <td className="p-5">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-355 bg-slate-50 dark:bg-slate-850 px-2 py-1 rounded-md">
                          {b.borrow_code || "—"}
                        </span>
                      </td>

                      {/* Student */}
                      <td className="p-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {b.student_name || "Unknown Student"}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                            {b.student_email || "Unknown Email"}
                          </span>
                        </div>
                      </td>

                      {/* Book */}
                      <td className="p-5">
                        <div className="flex items-center gap-2 max-w-xs">
                          <BookOpen className="h-4 w-4 text-indigo-500 shrink-0" />
                          <span className="font-bold text-slate-700 dark:text-slate-300 line-clamp-2">
                            {b.book?.title || "Unknown Book"}
                          </span>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="p-5 text-slate-500 font-medium">
                        <div className="space-y-1 text-[11px] md:text-xs">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>Request: {formatDate(b.borrow_date || b.created_at)}</span>
                          </div>
                          {b.status !== "pending" && b.status !== "rejected" && b.status !== "expired" && (
                            <div className="flex items-center gap-1 text-slate-400">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span>Due: {formatDate(b.due_date)}</span>
                            </div>
                          )}
                          {b.status === "returned" && (
                            <div className="flex items-center gap-1 text-emerald-600">
                              <CheckCircle className="h-3 w-3 shrink-0" />
                              <span>Returned: {formatDate(b.returned_at)}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Fines */}
                      <td className="p-5">
                        {b.fine_amount && b.fine_amount > 0 ? (
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={`font-bold text-[10px] ${
                                b.fine_paid ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              Rp {b.fine_amount.toLocaleString()}
                            </span>
                            <span
                              className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md w-fit ${
                                b.fine_paid
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                                  : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                              }`}
                            >
                              {b.fine_paid ? "Paid" : "Unpaid"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                            b.status === "returned"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : b.status === "overdue"
                              ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                              : b.status === "pending"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                              : b.status === "rejected"
                              ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                              : b.status === "expired"
                              ? "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500"
                              : "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                          }`}
                        >
                          {b.status}
                        </span>
                        {b.status === "rejected" && b.rejection_reason && (
                          <p className="text-[10px] text-rose-500 dark:text-rose-400 mt-1 italic max-w-[150px] line-clamp-2">
                            Reason: {b.rejection_reason}
                          </p>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-1.5">
                          {b.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(b)}
                                disabled={processingId === b.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50 text-[10px]"
                              >
                                {processingId === b.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3.5 w-3.5" />
                                )}
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenReject(b)}
                                disabled={processingId === b.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50 text-[10px]"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                Reject
                              </button>
                            </>
                          )}

                          {(b.status === "borrowed" || b.status === "overdue") && (
                            <button
                              onClick={() => handleReturn(b)}
                              disabled={processingId === b.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50 text-[10px]"
                            >
                              {processingId === b.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3.5 w-3.5" />
                              )}
                              Return Book
                            </button>
                          )}

                          {b.status === "returned" && b.fine_amount && b.fine_amount > 0 && !b.fine_paid && (
                            <button
                              onClick={() => handlePayFine(b)}
                              disabled={processingId === b.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all cursor-pointer disabled:opacity-50 text-[10px] shadow-sm shadow-emerald-600/10"
                            >
                              {processingId === b.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <DollarSign className="h-3.5 w-3.5" />
                              )}
                              Pay Fine
                            </button>
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
      )}

      {/* Reject Reason Dialog */}
      {rejectingBorrowing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-xl max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-1 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              <span>Reject Borrowing Request</span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-5 font-medium">
              Explain why this request is being rejected. The student will see this reason in their borrowing log.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Rejection Reason
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Out of stock, account status restrictions, etc."
                  className="w-full text-xs p-3 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 rounded-xl outline-hidden focus:border-rose-400 dark:focus:border-rose-900 transition-colors text-slate-800 dark:text-slate-200 resize-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={handleCloseReject}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={isRejecting}
                className="px-5 py-2 bg-rose-650 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-650/10 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isRejecting && <Loader2 className="h-3 w-3 animate-spin" />}
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
