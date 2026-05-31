import { supabase } from "./client";
import { getBookById } from "../api/books";

const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "your-supabase-anon-key"
);

// Favorites Operations
export async function fetchFavorites(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured) {
    const saved = localStorage.getItem("readspace_saved_books");
    return saved ? JSON.parse(saved) : [];
  }

  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("book_id")
      .eq("user_id", userId);

    if (error) throw error;
    return data ? data.map((fav) => fav.book_id) : [];
  } catch (error) {
    console.error("Error fetching favorites from Supabase:", error);
    // Fallback to localStorage
    const saved = localStorage.getItem("readspace_saved_books");
    return saved ? JSON.parse(saved) : [];
  }
}

export async function addFavorite(userId: string, bookId: string): Promise<boolean> {
  // Sync to localStorage as fallback/cache
  try {
    const saved = localStorage.getItem("readspace_saved_books");
    const list: string[] = saved ? JSON.parse(saved) : [];
    if (!list.includes(bookId)) {
      list.push(bookId);
      localStorage.setItem("readspace_saved_books", JSON.stringify(list));
    }
  } catch (e) {
    console.error("Error syncing to localStorage:", e);
  }

  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from("favorites")
      .insert({ user_id: userId, book_id: bookId });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error adding favorite to Supabase:", error);
    return false;
  }
}

export async function removeFavorite(userId: string, bookId: string): Promise<boolean> {
  // Sync to localStorage as fallback/cache
  try {
    const saved = localStorage.getItem("readspace_saved_books");
    let list: string[] = saved ? JSON.parse(saved) : [];
    list = list.filter((id) => id !== bookId);
    localStorage.setItem("readspace_saved_books", JSON.stringify(list));
  } catch (e) {
    console.error("Error syncing to localStorage:", e);
  }

  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("book_id", bookId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error removing favorite from Supabase:", error);
    return false;
  }
}

// Borrowings Operations
export async function fetchBorrowings(userId: string): Promise<any[]> {
  if (!isSupabaseConfigured) {
    const borrowed = localStorage.getItem("readspace_borrowed_books");
    return borrowed ? JSON.parse(borrowed) : [];
  }

  try {
    // Only retrieve active borrowings (status = 'Borrowed')
    const { data, error } = await supabase
      .from("borrowings")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "Borrowed");

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Map each borrowing record by fetching metadata from BukuAcak API
    const borrowingPromises = data.map(async (record) => {
      try {
        const book = await getBookById(record.book_id);
        if (!book) return null;
        return {
          id: record.book_id,
          title: book.title,
          author: book.author?.name || "Unknown Author",
          coverUrl: book.cover_image,
          category: book.category?.name || "General",
          borrowDate: record.borrow_date,
          dueDate: record.due_date,
          status: record.status,
        };
      } catch (err) {
        console.error(`Error loading book metadata for ID ${record.book_id}:`, err);
        return null;
      }
    });

    const results = await Promise.all(borrowingPromises);
    return results.filter((b) => b !== null);
  } catch (error) {
    console.error("Error fetching borrowings from Supabase:", error);
    const borrowed = localStorage.getItem("readspace_borrowed_books");
    return borrowed ? JSON.parse(borrowed) : [];
  }
}

export async function borrowBook(
  userId: string,
  bookId: string,
  bookDetails: { title: string; author: string; coverUrl: string; category: string }
): Promise<boolean> {
  const borrowDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14); // 14 days policy

  // Sync to localStorage
  try {
    const borrowed = localStorage.getItem("readspace_borrowed_books");
    const list = borrowed ? JSON.parse(borrowed) : [];
    if (!list.some((b: any) => b.id === bookId)) {
      list.push({
        id: bookId,
        title: bookDetails.title,
        author: bookDetails.author,
        coverUrl: bookDetails.coverUrl,
        category: bookDetails.category,
        borrowDate: borrowDate.toISOString(),
        dueDate: dueDate.toISOString(),
        status: "Borrowed",
      });
      localStorage.setItem("readspace_borrowed_books", JSON.stringify(list));
    }
  } catch (e) {
    console.error("Error syncing borrowing to localStorage:", e);
  }

  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase.from("borrowings").insert({
      user_id: userId,
      book_id: bookId,
      borrow_date: borrowDate.toISOString(),
      due_date: dueDate.toISOString(),
      status: "Borrowed",
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error borrowing book from Supabase:", error);
    return false;
  }
}

export async function returnBook(userId: string, bookId: string): Promise<boolean> {
  // Sync to localStorage
  try {
    const borrowed = localStorage.getItem("readspace_borrowed_books");
    if (borrowed) {
      const list = JSON.parse(borrowed).filter((b: any) => b.id !== bookId);
      localStorage.setItem("readspace_borrowed_books", JSON.stringify(list));
    }
  } catch (e) {
    console.error("Error syncing return to localStorage:", e);
  }

  if (!isSupabaseConfigured) return true;

  try {
    const { error } = await supabase
      .from("borrowings")
      .update({
        status: "Returned",
        return_date: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .eq("status", "Borrowed");

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error returning book in Supabase:", error);
    return false;
  }
}
