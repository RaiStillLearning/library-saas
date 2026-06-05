"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BookMarked,
  Search,
  Filter,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  Package,
  User,
  Clock,
  DollarSign,
  ClipboardList,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchReadSpaceBooks,
  borrowReadSpaceBook,
  fetchMyReadSpaceBorrowings,
  returnReadSpaceBook,
  ReadSpaceBook,
  ReadSpaceBorrowing,
} from "@/src/services/supabase/db";
import { useAuth } from "@/src/features/auth/hooks/use-auth";

const CATEGORIES = ["All", "Fiction", "Science Fiction", "Technology", "Self-Help", "History", "Biography", "Science", "Philosophy"];

export default function ReadSpaceBooksPage() {
  const { user, profile } = useAuth();

  // Check if the user has a @readspace.co email domain
  const userEmail = profile?.email || user?.email || "";
  const isReadSpaceUser = userEmail.toLowerCase().endsWith("@readspace.co");

  const [books, setBooks] = useState<ReadSpaceBook[]>([]);
  const [myBorrowings, setMyBorrowings] = useState<ReadSpaceBorrowing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [borrowingId, setBorrowingId] = useState<string | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<ReadSpaceBook | null>(null);

  const userId = user?.id || profile?.id || "";

  const loadData = useCallback(async () => {
    if (!userId || !isReadSpaceUser) return;
    setIsLoading(true);
    try {
      const [booksData, borrowingsData] = await Promise.all([
        fetchReadSpaceBooks(),
        fetchMyReadSpaceBorrowings(userId),
      ]);
      setBooks(booksData);
      setMyBorrowings(borrowingsData);
    } catch (err) {
      console.error("Error loading ReadSpace Books:", err);
      toast.error("Failed to load books.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const borrowedBookIds = new Set(myBorrowings.map((b) => b.book_id));

  const filteredBooks = books.filter((book) => {
    const matchesQuery =
      searchQuery.trim() === "" ||
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || book.category === selectedCategory;
    return matchesQuery && matchesCategory;
  });

  const handleBorrow = async (book: ReadSpaceBook) => {
    if (!userId) {
      toast.error("Please sign in to borrow books.");
      return;
    }
    setBorrowingId(book.id);
    try {
      const userInfo = {
        name: profile?.name || user?.email?.split("@")[0] || "Student",
        email: user?.email || "student@readspace.com",
      };
      const result = await borrowReadSpaceBook(userId, book.id, userInfo);
      if (result.success) {
        toast.success(result.message);
        await loadData();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to borrow book.");
    } finally {
      setBorrowingId(null);
    }
  };

  const handleReturn = async (borrowing: ReadSpaceBorrowing) => {
    setReturningId(borrowing.id);
    try {
      const success = await returnReadSpaceBook(userId, borrowing.book_id, borrowing.id);
      if (success) {
        toast.success("Book returned successfully!");
        await loadData();
      } else {
        toast.error("Failed to return book.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while returning.");
    } finally {
      setReturningId(null);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getDueStatusLabel = (b: ReadSpaceBorrowing) => {
    if (b.status === "pending") return "Pending Admin Approval";
    if (b.status === "rejected") return `Rejected: ${b.rejection_reason || "No reason given"}`;
    if (b.status === "expired") return "Request Expired";
    if (b.status === "returned") return `Returned on ${formatDate(b.returned_at)}`;

    if (!b.due_date) return "—";
    const dueTime = new Date(b.due_date).setHours(0, 0, 0, 0);
    const todayTime = new Date().setHours(0, 0, 0, 0);
    const diffTime = dueTime - todayTime;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""}`;
    } else if (diffDays === 0) {
      return "Due Today";
    } else {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} remaining`;
    }
  };

  if (!isReadSpaceUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-2xl w-24 h-24 -translate-x-4 -translate-y-4" />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl shadow-xl">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl">
              <Lock className="h-10 w-10 text-indigo-600 dark:text-indigo-400 animate-bounce" style={{ animationDuration: "3s" }} />
            </div>
          </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 font-display">
          Exclusive Access Required
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md font-medium text-sm md:text-base leading-relaxed">
          The ReadSpace internal library collection is only available to team members with a <code className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold font-mono">@readspace.co</code> email address.
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/10 active:scale-95 cursor-pointer"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const activeLoans = myBorrowings.filter((b) => b.status === "borrowed" || b.status === "overdue");
  const pendingLoans = myBorrowings.filter((b) => b.status === "pending");
  const overdueLoans = myBorrowings.filter((b) => b.status === "overdue");
  const outstandingFines = myBorrowings
    .filter((b) => b.fine_amount && b.fine_amount > 0 && !b.fine_paid)
    .reduce((sum, b) => sum + (b.fine_amount || 0), 0);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 font-display">
            <BookMarked className="h-7 w-7 text-indigo-600 shrink-0" />
            <span>ReadSpace Books</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Browse and borrow from the ReadSpace internal library collection
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {userId && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Active Loans",
              value: activeLoans.length,
              icon: BookOpen,
              color: "indigo",
              sub: "due in 14 days",
            },
            {
              label: "Pending Requests",
              value: pendingLoans.length,
              icon: Clock,
              color: "amber",
              sub: "waiting for approval",
            },
            {
              label: "Overdue Books",
              value: overdueLoans.length,
              icon: AlertCircle,
              color: "rose",
              sub: "late returns",
            },
            {
              label: "Outstanding Fines",
              value: `Rp ${outstandingFines.toLocaleString()}`,
              icon: DollarSign,
              color: outstandingFines > 0 ? "rose" : "emerald",
              sub: outstandingFines > 0 ? "unpaid fines" : "all clear",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <card.icon className={`h-4 w-4 ${
                  card.color === "indigo" ? "text-indigo-500" :
                  card.color === "amber" ? "text-amber-500" :
                  card.color === "rose" ? "text-rose-500" : "text-emerald-500"
                }`} />
              </div>
              <p className="text-xl font-black text-slate-900 dark:text-slate-50 mt-1">
                {isLoading ? "—" : card.value}
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-550 font-medium mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Active Borrowings & Requests list */}
      {userId && myBorrowings.length > 0 && (
        <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-indigo-500" />
            <span>My Loans & Requests</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myBorrowings
              .filter((b) => ["pending", "borrowed", "overdue", "rejected", "returned"].includes(b.status))
              .map((b) => {
                const isActive = b.status === "borrowed" || b.status === "overdue";
                const isOverdue = b.status === "overdue";
                const isPending = b.status === "pending";
                const isRejected = b.status === "rejected";
                const isReturned = b.status === "returned";

                let statusBadgeColor = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
                if (isPending) statusBadgeColor = "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400";
                if (isActive) statusBadgeColor = isOverdue ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400" : "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400";
                if (isRejected) statusBadgeColor = "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400";
                if (isReturned) statusBadgeColor = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400";

                const dueLabel = getDueStatusLabel(b);
                const hasFine = b.fine_amount && b.fine_amount > 0;

                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-4 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-100 dark:border-slate-800 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-850 dark:text-slate-200 text-sm leading-snug">
                          {b.book?.title || "Unknown Book"}
                        </span>
                        {b.borrow_code && (
                          <span className="font-mono text-[9px] bg-slate-50 dark:bg-slate-850 text-slate-400 font-bold px-1.5 py-0.5 rounded-sm">
                            {b.borrow_code}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] uppercase tracking-wide ${statusBadgeColor}`}>
                          {b.status}
                        </span>
                        <span className={`font-semibold ${
                          isOverdue ? "text-rose-500" : isPending ? "text-amber-605" : isRejected ? "text-slate-400" : "text-slate-550 dark:text-slate-400"
                        }`}>
                          {dueLabel}
                        </span>
                        {hasFine && (
                          <span className={`font-bold ${b.fine_paid ? "text-emerald-500" : "text-rose-500"}`}>
                            Fine: Rp {b.fine_amount?.toLocaleString()} ({b.fine_paid ? "Paid" : "Unpaid"})
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && (
                      <button
                        onClick={() => handleReturn(b)}
                        disabled={returningId === b.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        {returningId === b.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          "Return"
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition cursor-pointer"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Book Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-pulse"
            >
              <div className="h-52 bg-slate-100 dark:bg-slate-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="p-5 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl">
            <BookMarked className="h-10 w-10 text-indigo-400" />
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-700 dark:text-slate-300">No books found</p>
            <p className="text-sm text-slate-400 mt-1">
              {searchQuery ? "Try a different search term." : "The library catalog is empty. Ask an admin to add books."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredBooks.map((book) => {
            const isBorrowed = borrowedBookIds.has(book.id);
            const isAvailable = book.available_stock > 0;
            const isBorrowingThis = borrowingId === book.id;

            return (
              <div
                key={book.id}
                className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800/40 transition-all duration-200 flex flex-col"
              >
                {/* Cover */}
                <div
                  className="relative h-52 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-950/40 dark:to-purple-950/40 flex items-center justify-center cursor-pointer overflow-hidden"
                  onClick={() => setSelectedBook(book)}
                >
                  {book.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-center">
                      <BookMarked className="h-12 w-12 text-indigo-300 dark:text-indigo-600" />
                      <span className="text-xs font-medium text-indigo-400 dark:text-indigo-500 line-clamp-2">
                        {book.title}
                      </span>
                    </div>
                  )}

                  {/* Stock badge */}
                  <div
                    className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isAvailable
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                    }`}
                  >
                    {isAvailable ? `${book.available_stock} available` : "Out of stock"}
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <button
                    className="text-left cursor-pointer"
                    onClick={() => setSelectedBook(book)}
                  >
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <User className="h-3 w-3 shrink-0" />
                      {book.author}
                    </p>
                  </button>

                  {book.category && (
                    <span className="mt-2 inline-block self-start px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                      {book.category}
                    </span>
                  )}

                  <div className="mt-auto pt-3">
                    {isBorrowed ? (
                      <div className="flex items-center gap-2 justify-center py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          Borrowed
                        </span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleBorrow(book)}
                        disabled={!isAvailable || isBorrowingThis}
                        className={`w-full py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isAvailable
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow active:scale-95"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                        } disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {isBorrowingThis ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Borrowing...
                          </>
                        ) : isAvailable ? (
                          <>
                            <BookOpen className="h-4 w-4" />
                            Borrow
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4" />
                            Unavailable
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Book Detail Modal */}
      {selectedBook && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedBook(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  {selectedBook.title}
                </h2>
                <p className="text-sm text-slate-500 mt-1">{selectedBook.author}</p>
              </div>
              <button
                onClick={() => setSelectedBook(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {selectedBook.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {selectedBook.description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                {selectedBook.isbn && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">ISBN</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{selectedBook.isbn}</p>
                  </div>
                )}
                {selectedBook.publisher && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Publisher</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{selectedBook.publisher}</p>
                  </div>
                )}
                {selectedBook.published_year && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Published</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{selectedBook.published_year}</p>
                  </div>
                )}
                {selectedBook.category && (
                  <div>
                    <p className="text-xs text-slate-400 uppercase font-semibold">Category</p>
                    <p className="font-medium text-slate-700 dark:text-slate-300">{selectedBook.category}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                <Package className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  <strong className="text-slate-800 dark:text-slate-100">{selectedBook.available_stock}</strong>
                  {" "}of{" "}
                  <strong className="text-slate-800 dark:text-slate-100">{selectedBook.total_stock}</strong>
                  {" "}copies available
                </span>
              </div>

              {borrowedBookIds.has(selectedBook.id) ? (
                <div className="flex items-center gap-2 justify-center py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    You&apos;re currently borrowing this book
                  </span>
                </div>
              ) : (
                <button
                  onClick={async () => {
                    await handleBorrow(selectedBook);
                    setSelectedBook(null);
                  }}
                  disabled={selectedBook.available_stock <= 0 || borrowingId === selectedBook.id}
                  className="w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {borrowingId === selectedBook.id ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Borrowing...
                    </>
                  ) : selectedBook.available_stock > 0 ? (
                    <>
                      <BookOpen className="h-4 w-4" />
                      Borrow this Book
                    </>
                  ) : (
                    "No copies available"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
