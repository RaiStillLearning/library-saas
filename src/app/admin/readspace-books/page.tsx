"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookMarked,
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  X,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchReadSpaceBooks,
  createReadSpaceBook,
  updateReadSpaceBook,
  deleteReadSpaceBook,
  fetchAllReadSpaceBorrowingsAdmin,
  adminReturnReadSpaceBook,
  ReadSpaceBook,
  ReadSpaceBorrowing,
} from "@/src/services/supabase/db";

const CATEGORIES = [
  "Fiction",
  "Science Fiction",
  "Technology",
  "Self-Help",
  "History",
  "Biography",
  "Science",
  "Philosophy",
  "Non-Fiction",
  "Other",
];

const EMPTY_FORM: Omit<ReadSpaceBook, "id" | "created_at" | "updated_at"> = {
  title: "",
  author: "",
  isbn: "",
  publisher: "",
  published_year: undefined,
  description: "",
  cover_url: "",
  total_stock: 1,
  available_stock: 1,
  category: "Fiction",
};

type TabType = "books" | "borrowings";

export default function AdminReadSpaceBooksPage() {
  const [activeTab, setActiveTab] = useState<TabType>("books");
  const [books, setBooks] = useState<ReadSpaceBook[]>([]);
  const [borrowings, setBorrowings] = useState<ReadSpaceBorrowing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingBook, setEditingBook] = useState<ReadSpaceBook | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Return state
  const [processingReturnId, setProcessingReturnId] = useState<string | null>(null);

  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const [booksData, borrowingsData] = await Promise.all([
        fetchReadSpaceBooks(),
        fetchAllReadSpaceBorrowingsAdmin(),
      ]);
      setBooks(booksData);
      setBorrowings(borrowingsData);
    } catch (err) {
      console.error("Error loading data:", err);
      toast.error("Failed to load data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleOpenAdd = () => {
    setEditingBook(null);
    setFormData(EMPTY_FORM);
    setShowForm(true);
  };

  const handleOpenEdit = (book: ReadSpaceBook) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn || "",
      publisher: book.publisher || "",
      published_year: book.published_year,
      description: book.description || "",
      cover_url: book.cover_url || "",
      total_stock: book.total_stock,
      available_stock: book.available_stock,
      category: book.category || "Fiction",
    });
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingBook(null);
    setFormData(EMPTY_FORM);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.author.trim()) {
      toast.error("Title and author are required.");
      return;
    }
    if (formData.total_stock < 1) {
      toast.error("Total stock must be at least 1.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingBook) {
        const updated = await updateReadSpaceBook(editingBook.id, formData);
        if (updated) {
          toast.success("Book updated successfully!");
          await loadBooks();
          handleCloseForm();
        } else {
          toast.error("Failed to update book.");
        }
      } else {
        const created = await createReadSpaceBook(formData);
        if (created) {
          toast.success("Book added to the library!");
          await loadBooks();
          handleCloseForm();
        } else {
          toast.error("Failed to add book.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const success = await deleteReadSpaceBook(id);
      if (success) {
        toast.success("Book removed from the library.");
        await loadBooks();
      } else {
        toast.error("Failed to delete book.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting.");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleMarkReturned = async (borrowing: ReadSpaceBorrowing) => {
    setProcessingReturnId(borrowing.id);
    try {
      const success = await adminReturnReadSpaceBook(borrowing.id, borrowing.book_id);
      if (success) {
        toast.success("Marked as returned. Stock restored.");
        await loadBooks();
      } else {
        toast.error("Failed to process return.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    } finally {
      setProcessingReturnId(null);
    }
  };

  const filteredBooks = books.filter((book) => {
    if (!searchQuery.trim()) return true;
    return (
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredBorrowings = borrowings.filter((b) => {
    if (!searchQuery.trim()) return true;
    return (
      b.book?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.student_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "—";
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
            <BookMarked className="h-7 w-7 text-indigo-600 shrink-0" />
            <span>ReadSpace Books</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Manage the internal library inventory — add, edit, delete books and monitor borrowings
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Book</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Books", value: books.length, color: "indigo" },
          {
            label: "Total Copies",
            value: books.reduce((s, b) => s + b.total_stock, 0),
            color: "blue",
          },
          {
            label: "Available",
            value: books.reduce((s, b) => s + b.available_stock, 0),
            color: "emerald",
          },
          {
            label: "Borrowed Out",
            value: borrowings.filter((b) => b.status === "borrowed").length,
            color: "amber",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className={`bg-${color}-50 dark:bg-${color}-950/20 border border-${color}-100 dark:border-${color}-900/30 rounded-2xl p-4`}
          >
            <p className={`text-xs font-semibold text-${color}-500 dark:text-${color}-400 uppercase tracking-wide`}>
              {label}
            </p>
            <p className={`text-2xl font-bold text-${color}-700 dark:text-${color}-300 mt-1`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {(["books", "borrowings"] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer capitalize ${
                activeTab === tab
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {tab === "books" ? (
                <span className="flex items-center gap-1.5">
                  <BookMarked className="h-3.5 w-3.5" /> Books ({books.length})
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <ClipboardList className="h-3.5 w-3.5" /> Borrowings ({borrowings.filter((b) => b.status === "borrowed").length} active)
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
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
      </div>

      {/* Books Tab */}
      {activeTab === "books" && (
        <>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 animate-pulse space-y-3"
                >
                  <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-3/4" />
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                  <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded mt-4" />
                </div>
              ))}
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="p-5 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl">
                <BookMarked className="h-10 w-10 text-indigo-400" />
              </div>
              <div className="text-center">
                <p className="font-bold text-slate-700 dark:text-slate-300">No books yet</p>
                <p className="text-sm text-slate-400 mt-1">
                  Click &ldquo;Add Book&rdquo; to add the first book to the library.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 hover:border-indigo-200 dark:hover:border-indigo-800/40 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{book.author}</p>
                    </div>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(book)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(book.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {book.category && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {book.category}
                      </span>
                    )}
                    {book.published_year && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        {book.published_year}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Package className="h-3.5 w-3.5" />
                      <span>
                        <strong className="text-slate-700 dark:text-slate-300">
                          {book.available_stock}
                        </strong>
                        /{book.total_stock} available
                      </span>
                    </div>
                    <div
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        book.available_stock > 0
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                          : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"
                      }`}
                    >
                      {book.available_stock > 0 ? "Available" : "Out of Stock"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Borrowings Tab */}
      {activeTab === "borrowings" && (
        <>
          {isLoading ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 animate-pulse space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded" />
              ))}
            </div>
          ) : filteredBorrowings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <ClipboardList className="h-10 w-10 text-slate-400" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-300">No borrowing records</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100/80 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px] md:text-xs">
                      <th className="p-5 font-semibold">Book</th>
                      <th className="p-5 font-semibold">Student</th>
                      <th className="p-5 font-semibold">Borrow Date</th>
                      <th className="p-5 font-semibold">Due Date</th>
                      <th className="p-5 font-semibold">Status</th>
                      <th className="p-5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {filteredBorrowings.map((b) => (
                      <tr
                        key={b.id}
                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                      >
                        <td className="p-5">
                          <span className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {b.book?.title || b.book_id}
                          </span>
                          <span className="text-xs text-slate-400 block">
                            {b.book?.author || ""}
                          </span>
                        </td>
                        <td className="p-5">
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {b.student_name || "—"}
                          </span>
                          <span className="text-xs text-slate-400 block">{b.student_email || ""}</span>
                        </td>
                        <td className="p-5 text-slate-500 font-medium">
                          {formatDate(b.borrow_date)}
                        </td>
                        <td className="p-5 text-slate-500 font-medium">
                          {formatDate(b.due_date)}
                        </td>
                        <td className="p-5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] md:text-xs ${
                              b.status === "returned"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : b.status === "overdue"
                                ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                                : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                        <td className="p-5 text-right">
                          {b.status === "borrowed" && (
                            <button
                              onClick={() => handleMarkReturned(b)}
                              disabled={processingReturnId === b.id}
                              className="p-2 border border-emerald-100 text-emerald-600 hover:bg-emerald-50 rounded-xl dark:border-slate-800 dark:hover:bg-slate-800 cursor-pointer disabled:opacity-50 transition-all"
                              title="Mark as Returned"
                            >
                              {processingReturnId === b.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Add / Edit Book Form Modal ── */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
          onClick={handleCloseForm}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                {editingBook ? "Edit Book" : "Add New Book"}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Book title"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Author <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData((f) => ({ ...f, author: e.target.value }))}
                    placeholder="Author name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Total Stock <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.total_stock}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        total_stock: parseInt(e.target.value) || 1,
                        available_stock: editingBook
                          ? f.available_stock
                          : parseInt(e.target.value) || 1,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    ISBN
                  </label>
                  <input
                    type="text"
                    value={formData.isbn || ""}
                    onChange={(e) => setFormData((f) => ({ ...f, isbn: e.target.value }))}
                    placeholder="e.g. 9780743273565"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Publisher
                  </label>
                  <input
                    type="text"
                    value={formData.publisher || ""}
                    onChange={(e) => setFormData((f) => ({ ...f, publisher: e.target.value }))}
                    placeholder="Publisher name"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Year Published
                  </label>
                  <input
                    type="number"
                    min={1000}
                    max={new Date().getFullYear()}
                    value={formData.published_year || ""}
                    onChange={(e) =>
                      setFormData((f) => ({
                        ...f,
                        published_year: parseInt(e.target.value) || undefined,
                      }))
                    }
                    placeholder="e.g. 2024"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Cover Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.cover_url || ""}
                    onChange={(e) => setFormData((f) => ({ ...f, cover_url: e.target.value }))}
                    placeholder="https://example.com/cover.jpg"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description of the book..."
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={handleCloseForm}
                className="px-5 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-60 active:scale-95"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {editingBook ? "Save Changes" : "Add Book"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {confirmDeleteId && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setConfirmDeleteId(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-red-50 dark:bg-red-950/30 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Delete Book</h3>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              Are you sure you want to delete this book from the library? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold cursor-pointer transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {deletingId === confirmDeleteId ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
