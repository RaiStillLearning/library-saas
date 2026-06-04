"use client";

import React, { useState, useEffect, useCallback } from "react";
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
    if (!userId) return;
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

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

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
        {myBorrowings.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <BookOpen className="h-4 w-4 text-indigo-500" />
            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">
              {myBorrowings.length} book{myBorrowings.length > 1 ? "s" : ""} borrowed
            </span>
          </div>
        )}
      </div>

      {/* Active Borrowings Strip */}
      {myBorrowings.length > 0 && (
        <div className="bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/30 p-5">
          <h2 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" />
            Currently Borrowing
          </h2>
          <div className="flex flex-wrap gap-3">
            {myBorrowings.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 border border-indigo-100 dark:border-indigo-900/30 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {b.book?.title || "Unknown"}
                  </p>
                  <p className="text-xs text-slate-400">Due: {formatDate(b.due_date)}</p>
                </div>
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
              </div>
            ))}
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
