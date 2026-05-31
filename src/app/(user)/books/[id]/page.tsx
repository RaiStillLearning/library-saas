"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Star,
  Bookmark,
  ClipboardList,
  Info,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  ShoppingBag,
  Layers,
  Globe,
  Loader2,
} from "lucide-react";
import { MOCK_BOOKS, Book } from "@/src/lib/constants";
import { getBookById, getBooks, BukuAcakBook } from "@/src/services/api/books";
import { BookCard } from "@/src/components/books/book-card";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";
import { useAuth } from "@/src/providers/supabase-provider";
import {
  fetchFavorites,
  addFavorite,
  removeFavorite,
  fetchBorrowings,
  borrowBook,
  returnBook,
} from "@/src/services/supabase/db";
import { BookDetailSkeleton } from "@/src/components/shared/skeletons";

interface BookDetailPageProps {
  params: Promise<{ id: string }>;
}

// Map BukuAcakBook to the internal Book interface for BookCard reuse
function mapBukuAcakToBook(baBook: BukuAcakBook): Book {
  return {
    id: baBook._id,
    title: baBook.title,
    author: baBook.author?.name || "Unknown Author",
    description: baBook.summary || "",
    coverUrl: baBook.cover_image || "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=600&h=900&fit=crop",
    category: baBook.category?.name || "General",
    stock: 5,
    availableStock: 5,
    rating: 4.5,
    status: "Available",
  };
}

export default function BookDetailPage({ params }: BookDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);

  const { user } = useAuth();
  const [isBorrowed, setIsBorrowed] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Fetch book details from BukuAcak API using TanStack Query
  const {
    data: apiBook,
    isLoading: isBookLoading,
    error: bookError,
  } = useQuery({
    queryKey: ["bookDetail", id],
    queryFn: () => getBookById(id),
    retry: 1, // Only retry once before falling back
  });

  // Fallback to MOCK_BOOKS if the ID is a mock ID or the API fails
  const mockBook = MOCK_BOOKS.find((b) => b.id === id);
  const book: BukuAcakBook | null = apiBook
    ? apiBook
    : mockBook
    ? {
        _id: mockBook.id,
        title: mockBook.title,
        cover_image: mockBook.coverUrl,
        author: { name: mockBook.author },
        category: { name: mockBook.category },
        summary: mockBook.description,
        publisher: "ReadSpace Press",
        details: {
          isbn: "978-0123456789",
          total_pages: "320 pages",
          price: "Rp 99,000",
          published_date: "12 May 2024",
          format: "Soft Cover",
        },
        buy_links: [
          {
            store: "Search on Gramedia.com",
            url: `https://www.gramedia.com/search?q=${encodeURIComponent(mockBook.title)}`,
          },
        ],
      }
    : null;

  // Fetch related books based on current book's category
  const { data: relatedData, isLoading: isRelatedLoading } = useQuery({
    queryKey: ["relatedBooks", book?.category?.name],
    queryFn: () => getBooks({ genre: book?.category?.name }),
    enabled: !!book?.category?.name,
  });

  // Initialize saved and borrowed states from Supabase (with localStorage fallback)
  useEffect(() => {
    if (!id || !user?.id) return;

    const initStates = async () => {
      try {
        const favorites = await fetchFavorites(user.id);
        setIsSaved(favorites.includes(id));

        const borrowings = await fetchBorrowings(user.id);
        setIsBorrowed(borrowings.some((b: any) => b.id === id));
      } catch (e) {
        console.error("Failed to initialize user book state:", e);
      }
    };

    initStates();
  }, [id, user?.id]);

  if (isBookLoading) {
    return <BookDetailSkeleton />;
  }

  if (!book && bookError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Failed to load book</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            The requested book metadata could not be retrieved from the API catalog.
          </p>
        </div>
        <button
          onClick={() => router.push("/discover")}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
        >
          Return to Discover
        </button>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Book Not Found</h2>
        <button
          onClick={() => router.push("/discover")}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
        >
          Return to Discover
        </button>
      </div>
    );
  }

  // Handle Borrow
  const handleBorrow = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to borrow books.");
      return;
    }

    try {
      const success = await borrowBook(user.id, book._id, {
        title: book.title,
        author: book.author.name,
        coverUrl: book.cover_image,
        category: book.category.name,
      });

      if (success) {
        setIsBorrowed(true);
        toast.success(`Successfully borrowed "${book.title}". Due in 14 days.`);
      } else {
        toast.error("Failed to process borrowing request.");
      }
    } catch (e) {
      toast.error("Failed to process borrowing request.");
    }
  };

  // Handle Return
  const handleReturn = async () => {
    if (!user?.id) return;

    try {
      const success = await returnBook(user.id, book._id);
      if (success) {
        setIsBorrowed(false);
        toast.success(`Returned "${book.title}" successfully.`);
      } else {
        toast.error("Failed to return book.");
      }
    } catch (e) {
      toast.error("Failed to return book.");
    }
  };

  // Handle Favorite/Save Toggle
  const handleSaveToggle = async () => {
    if (!user?.id) {
      toast.error("You must be logged in to save books.");
      return;
    }

    try {
      if (isSaved) {
        const success = await removeFavorite(user.id, book._id);
        if (success) {
          setIsSaved(false);
          toast.success(`Removed "${book.title}" from saved list.`);
        } else {
          toast.error("Failed to remove book.");
        }
      } else {
        const success = await addFavorite(user.id, book._id);
        if (success) {
          setIsSaved(true);
          toast.success(`Saved "${book.title}" to library.`);
        } else {
          toast.error("Failed to save book.");
        }
      }
    } catch (e) {
      toast.error("Failed to save book.");
    }
  };

  // Filter out the current book from related recommendations
  const relatedBooksList = (relatedData?.books || [])
    .filter((b: BukuAcakBook) => b._id !== book._id)
    .slice(0, 4);

  return (
    <div className="space-y-10 pb-20 max-w-5xl mx-auto">
      {/* Back Link */}
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 font-semibold text-sm transition-colors group cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to collection</span>
      </button>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Cover & Action Panel */}
        <div className="space-y-6">
          {/* Cover card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800 transition-colors flex justify-center">
            <div className="relative aspect-[3/4] w-full max-w-[260px] rounded-2xl overflow-hidden shadow-md">
              <img
                src={book.cover_image}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-semibold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 rounded-lg shadow-sm border border-slate-100/50 backdrop-blur-xs">
                {book.category.name}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-3 transition-colors">
            {/* Borrow or Return Button */}
            {isBorrowed ? (
              <button
                onClick={handleReturn}
                className="w-full h-12 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-red-950/20 dark:hover:text-red-400 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ClipboardList className="h-4.5 w-4.5" />
                <span>Return Book</span>
              </button>
            ) : (
              <button
                onClick={handleBorrow}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2 cursor-pointer"
              >
                <ClipboardList className="h-4.5 w-4.5" />
                <span>Borrow Book</span>
              </button>
            )}

            {/* Save for later Button */}
            <button
              onClick={handleSaveToggle}
              className={cn(
                "w-full h-12 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 border cursor-pointer",
                isSaved
                  ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400"
                  : "bg-white border-slate-200 text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <Bookmark className={cn("h-4.5 w-4.5", isSaved && "fill-rose-500")} />
              <span>{isSaved ? "Saved in Library" : "Save for Later"}</span>
            </button>
          </div>

          {/* Buy Links Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-4 transition-colors">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <ShoppingBag className="h-4.5 w-4.5 text-blue-600" />
              <span>Buy Book Option</span>
            </h3>
            <div className="space-y-2.5">
              {book.buy_links && book.buy_links.length > 0 ? (
                book.buy_links.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-11 border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl text-xs font-semibold transition-all flex items-center justify-between px-4 group cursor-pointer"
                  >
                    <span className="truncate">{link.store}</span>
                    <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                ))
              ) : (
                <a
                  href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(
                    book.title + " " + book.author.name
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-11 border border-slate-200 text-slate-700 dark:border-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-xl text-xs font-semibold transition-all flex items-center justify-between px-4 group cursor-pointer"
                >
                  <span>Search on Google Shopping</span>
                  <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Information Panel */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-6 transition-colors">
            {/* Title & Author */}
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
                {book.title}
              </h1>
              <p className="text-base text-slate-500 dark:text-slate-400 font-medium">
                by{" "}
                {book.author.url ? (
                  <a
                    href={book.author.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    {book.author.name}
                  </a>
                ) : (
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                    {book.author.name}
                  </span>
                )}
              </p>
            </div>

            {/* Ratings & Category Badges */}
            <div className="flex flex-wrap gap-4 items-center py-4 border-y border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <Star className="h-5 w-5 fill-amber-400 stroke-amber-400" />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">4.5</span>
                <span className="text-xs text-slate-400 font-medium">/ 5.0 Rating</span>
              </div>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block" />

              {/* Category */}
              {book.category.url ? (
                <a
                  href={book.category.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  {book.category.name}
                </a>
              ) : (
                <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full text-xs font-semibold">
                  {book.category.name}
                </span>
              )}
            </div>

            {/* About Book Summary */}
            <div className="space-y-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">Summary</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium whitespace-pre-wrap">
                {book.summary || "No summary available for this book."}
              </p>
            </div>

            {/* Policies warning banner */}
            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 rounded-2xl border border-amber-100/50 dark:border-amber-900/20 flex gap-3 text-amber-800 dark:text-amber-400">
              <Info className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold">Borrowing Notice</h4>
                <p className="text-[11px] leading-relaxed font-medium opacity-90">
                  This book can be borrowed from our physical catalog or reserved online. Digital reading content is currently not available due to publisher licensing restrictions.
                </p>
              </div>
            </div>

            {/* Book metadata table */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-50">Specification Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Globe className="h-4 w-4 shrink-0" />
                    <span>ISBN-13</span>
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">
                    {book.details.isbn && book.details.isbn !== "0" ? book.details.isbn : "Unavailable"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 shrink-0" />
                    <span>Publisher</span>
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[150px]">
                    {book.publisher || "Gramedia Press"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Layers className="h-4 w-4 shrink-0" />
                    <span>Total Pages</span>
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">
                    {book.details.total_pages || "Unavailable"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/40">
                  <span className="text-slate-400 font-medium">Original Price</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">
                    {book.details.price || "Unavailable"}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags section */}
            {book.tags && book.tags.length > 0 && (
              <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tags</h3>
                <div className="flex flex-wrap gap-1.5">
                  {book.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs bg-slate-50 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400 rounded-lg border border-slate-100 dark:border-slate-800/50"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Books Section */}
      <div className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-col space-y-1">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Related Books</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            More books from the <span className="font-semibold text-blue-600">{book.category.name}</span> category
          </p>
        </div>

        {isRelatedLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin h-6 w-6 text-blue-600" />
          </div>
        ) : relatedBooksList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {relatedBooksList.map((relatedBook: BukuAcakBook) => (
              <BookCard key={relatedBook._id} book={mapBukuAcakToBook(relatedBook)} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-sm">
            No related books found in this category.
          </div>
        )}
      </div>
    </div>
  );
}
