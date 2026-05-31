"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  MoreVertical,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { MOCK_BOOKS, Book } from "@/src/lib/constants";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { TableSkeleton } from "@/src/components/shared/skeletons";

export default function AdminBooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  // Form Fields State
  const [formTitle, setFormTitle] = useState("");
  const [formAuthor, setFormAuthor] = useState("");
  const [formCategory, setFormCategory] = useState("Fiction");
  const [formCover, setFormCover] = useState("");
  const [formStock, setFormStock] = useState(5);
  const [formDesc, setFormDesc] = useState("");

  // Load initial books on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setBooks(MOCK_BOOKS);
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Filter books
  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || book.category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "available" && book.availableStock > 0) ||
      (statusFilter === "outofstock" && book.availableStock === 0) ||
      (statusFilter === "borrowed" && book.status === "Borrowed");

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
  const paginatedBooks = filteredBooks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Open Dialog for adding
  const handleOpenAddDialog = () => {
    setEditingBook(null);
    setFormTitle("");
    setFormAuthor("");
    setFormCategory("Fiction");
    setFormCover("https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&h=900&fit=crop");
    setFormStock(5);
    setFormDesc("");
    setIsDialogOpen(true);
  };

  // Open Dialog for editing
  const handleOpenEditDialog = (book: Book) => {
    setEditingBook(book);
    setFormTitle(book.title);
    setFormAuthor(book.author);
    setFormCategory(book.category);
    setFormCover(book.coverUrl);
    setFormStock(book.stock);
    setFormDesc(book.description);
    setIsDialogOpen(true);
  };

  // Save Book Handler (Add/Edit)
  const handleSaveBook = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle || !formAuthor) {
      toast.error("Title and Author are required");
      return;
    }

    if (editingBook) {
      // Edit mode
      const updatedBooks = books.map((b) =>
        b.id === editingBook.id
          ? {
              ...b,
              title: formTitle,
              author: formAuthor,
              category: formCategory,
              coverUrl: formCover,
              stock: formStock,
              availableStock: formStock, // keep in sync for demo
              description: formDesc,
            }
          : b
      );
      setBooks(updatedBooks);
      toast.success(`Book "${formTitle}" updated successfully`);
    } else {
      // Add mode
      const newBook: Book = {
        id: `book-${Date.now()}`,
        title: formTitle,
        author: formAuthor,
        category: formCategory,
        coverUrl: formCover || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&h=900&fit=crop",
        stock: formStock,
        availableStock: formStock,
        rating: 4.5,
        status: "Available",
        description: formDesc || "No description provided.",
      };
      setBooks([newBook, ...books]);
      toast.success(`Book "${formTitle}" added successfully`);
    }

    setIsDialogOpen(false);
  };

  // Delete Book Handler
  const handleDeleteBook = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      setBooks(books.filter((b) => b.id !== id));
      toast.success(`Book "${title}" deleted successfully`);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Books Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Manage your library's book collection and catalog records
          </p>
        </div>
        <button
          onClick={handleOpenAddDialog}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-200 dark:shadow-none cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Book</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-100/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 transition-colors">
        {/* Search input field */}
        <div className="relative w-full md:max-w-md flex items-center">
          <Search className="h-4.5 w-4.5 text-slate-400 absolute left-3 pointer-events-none" />
          <input
            type="search"
            placeholder="Search by title, author, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-sm focus:border-blue-600 focus:bg-white placeholder:text-slate-400 text-slate-900 dark:text-slate-50 dark:border-slate-700 dark:bg-slate-800/50 dark:focus:bg-slate-900 transition-all"
          />
        </div>

        {/* Filters dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 md:flex-initial border border-slate-200 rounded-xl py-2 px-3 text-xs bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="fiction">Fiction</option>
            <option value="romance">Romance</option>
            <option value="biography">Biography</option>
            <option value="thriller">Thriller</option>
            <option value="science fiction">Science Fiction</option>
            <option value="history">History</option>
            <option value="business">Business</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:flex-initial border border-slate-200 rounded-xl py-2 px-3 text-xs bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 outline-none focus:border-blue-600 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="outofstock">Out of Stock</option>
            <option value="borrowed">Borrowed</option>
          </select>
        </div>
      </div>

      {/* Books Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm dark:bg-slate-900 dark:border-slate-800 overflow-hidden transition-all duration-300">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="p-4 font-semibold">Title</th>
                  <th className="p-4 font-semibold">Author</th>
                  <th className="p-4 font-semibold">Category</th>
                  <th className="p-4 font-semibold">Copies Available</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                {paginatedBooks.length > 0 ? (
                  paginatedBooks.map((book) => {
                    const isAvailable = book.availableStock > 0;
                    return (
                      <tr key={book.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              className="h-10 w-7 rounded object-cover shadow-xs"
                            />
                            <div className="font-bold text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                              {book.title}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-semibold text-slate-500 dark:text-slate-400">{book.author}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {book.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={cn(
                              "font-bold",
                              isAvailable
                                ? "text-slate-700 dark:text-slate-300"
                                : "text-rose-500 font-extrabold"
                            )}
                          >
                            {book.availableStock} / {book.stock}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px]",
                              isAvailable
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                            )}
                          >
                            {isAvailable ? <CheckCircle2 className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                            <span>{isAvailable ? "Available" : "Out of Stock"}</span>
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditDialog(book)}
                              className="p-1.5 border border-slate-150 hover:bg-slate-50 hover:text-blue-600 rounded-lg dark:border-slate-800 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Edit Book"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBook(book.id, book.title)}
                              className="p-1.5 border border-slate-150 text-rose-500 hover:bg-rose-50 rounded-lg dark:border-slate-800 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                              title="Delete Book"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                      No books matches the filter parameters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400 font-semibold">
                Showing {Math.min(filteredBooks.length, (currentPage - 1) * itemsPerPage + 1)}-
                {Math.min(filteredBooks.length, currentPage * itemsPerPage)} of {filteredBooks.length} books
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Dialog Form overlay */}
      {isDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Dialog Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50">
                {editingBook ? "Edit Book Metadata" : "Add New Book"}
              </h3>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors cursor-pointer text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dialog Form */}
            <form onSubmit={handleSaveBook} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Harry Potter dan Batu Bertuah"
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-xs focus:border-blue-600 focus:bg-white placeholder:text-slate-400 text-slate-900 dark:text-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Author</label>
                  <input
                    type="text"
                    required
                    value={formAuthor}
                    onChange={(e) => setFormAuthor(e.target.value)}
                    placeholder="e.g. J.K. Rowling"
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-xs focus:border-blue-600 focus:bg-white placeholder:text-slate-400 text-slate-900 dark:text-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-xs focus:border-blue-600 focus:bg-white text-slate-900 dark:text-slate-50 dark:border-slate-800 dark:bg-slate-800/50 cursor-pointer"
                  >
                    <option value="Fiction">Fiction</option>
                    <option value="Romance">Romance</option>
                    <option value="Biography">Biography</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Science Fiction">Science Fiction</option>
                    <option value="History">History</option>
                    <option value="Business">Business</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cover Image URL</label>
                  <input
                    type="text"
                    value={formCover}
                    onChange={(e) => setFormCover(e.target.value)}
                    placeholder="Unsplash or direct image URL..."
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-xs focus:border-blue-600 focus:bg-white placeholder:text-slate-400 text-slate-900 dark:text-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Copies</label>
                  <input
                    type="number"
                    min={1}
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-xs focus:border-blue-600 focus:bg-white text-slate-900 dark:text-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Summary / Synopsis</label>
                <textarea
                  rows={4}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Enter book summary..."
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-xl bg-slate-50/50 outline-none text-xs focus:border-blue-600 focus:bg-white placeholder:text-slate-400 text-slate-900 dark:text-slate-50 dark:border-slate-800 dark:bg-slate-800/50 resize-none"
                />
              </div>

              {/* Dialog Footer Actions */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-200 dark:shadow-none cursor-pointer"
                >
                  Save Book
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
