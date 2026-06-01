import { supabase } from "./client";
import { getBookById } from "../api/books";

const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "your-supabase-anon-key"
);

function shouldUseMock(userId?: string): boolean {
  if (!isSupabaseConfigured) return true;
  if (userId && userId.startsWith("mock-")) return true;
  
  if (typeof window !== "undefined") {
    const hasMockSession = localStorage.getItem("readspace_mock_user") !== null || 
                          document.cookie.includes("readspace_mock_session");
    if (hasMockSession) return true;
  }
  
  return false;
}

// Favorites Operations
export async function fetchFavorites(userId: string): Promise<string[]> {
  if (shouldUseMock(userId)) {
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

  if (shouldUseMock(userId)) return true;

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

  if (shouldUseMock(userId)) return true;

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
  if (shouldUseMock(userId)) {
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
          borrowingId: record.id,
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

export async function fetchBorrowHistory(userId: string): Promise<any[]> {
  if (shouldUseMock(userId)) {
    const history = localStorage.getItem("readspace_borrow_history");
    if (!history) {
      // Fallback: copy active borrowings as starting history
      const active = localStorage.getItem("readspace_borrowed_books");
      if (active) {
        localStorage.setItem("readspace_borrow_history", active);
        return JSON.parse(active);
      }
      return [];
    }
    return JSON.parse(history);
  }

  try {
    const { data, error } = await supabase
      .from("borrowings")
      .select("*")
      .eq("user_id", userId)
      .order("borrow_date", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Map each borrowing record by fetching metadata from BukuAcak API
    const borrowingPromises = data.map(async (record) => {
      try {
        const book = await getBookById(record.book_id);
        if (!book) return null;
        return {
          id: record.book_id,
          borrowingId: record.id,
          title: book.title,
          author: book.author?.name || "Unknown Author",
          coverUrl: book.cover_image,
          category: book.category?.name || "General",
          borrowDate: record.borrow_date,
          dueDate: record.due_date,
          returnDate: record.return_date,
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
    console.error("Error fetching borrow history from Supabase:", error);
    const history = localStorage.getItem("readspace_borrow_history");
    return history ? JSON.parse(history) : [];
  }
}

export async function fetchAllBorrowingsAdmin(): Promise<any[]> {
  if (shouldUseMock()) {
    const history = localStorage.getItem("readspace_borrow_history");
    const list = history ? JSON.parse(history) : [];
    return list.map((record: any) => ({
      id: record.borrowingId || record.id || Math.random().toString(36).substr(2, 9),
      bookId: record.id,
      title: record.title,
      studentName: record.studentName || "John Doe",
      studentEmail: record.studentEmail || "student@readspace.com",
      borrowDate: record.borrowDate,
      dueDate: record.dueDate,
      returnDate: record.returnDate,
      status: record.status,
    }));
  }

  try {
    const { data, error } = await supabase
      .from("borrowings")
      .select(`
        id,
        user_id,
        book_id,
        borrow_date,
        due_date,
        return_date,
        status,
        profiles (
          name,
          email
        )
      `)
      .order("borrow_date", { ascending: false });

    if (error) throw error;
    if (!data) return [];

    const borrowingPromises = data.map(async (record: any) => {
      try {
        const book = await getBookById(record.book_id);
        if (!book) return null;
        return {
          id: record.id,
          bookId: record.book_id,
          title: book.title,
          studentName: record.profiles?.name || "Unknown Student",
          studentEmail: record.profiles?.email || "Unknown Email",
          borrowDate: record.borrow_date,
          dueDate: record.due_date,
          returnDate: record.return_date,
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
    console.error("Error fetching admin borrowings from Supabase:", error);
    const history = localStorage.getItem("readspace_borrow_history");
    const list = history ? JSON.parse(history) : [];
    return list.map((record: any) => ({
      id: record.borrowingId || record.id || Math.random().toString(36).substr(2, 9),
      bookId: record.id,
      title: record.title,
      studentName: record.studentName || "John Doe",
      studentEmail: record.studentEmail || "student@readspace.com",
      borrowDate: record.borrowDate,
      dueDate: record.dueDate,
      returnDate: record.returnDate,
      status: record.status,
    }));
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

  let studentName = "John Doe";
  let studentEmail = "student@readspace.com";
  try {
    const profileStr = localStorage.getItem("readspace_mock_profile");
    if (profileStr) {
      const p = JSON.parse(profileStr);
      studentName = p.name || studentName;
      studentEmail = p.email || studentEmail;
    }
  } catch (e) {}

  const borrowingId = Math.random().toString(36).substring(2, 15);

  // Sync to localStorage
  try {
    const borrowed = localStorage.getItem("readspace_borrowed_books");
    const list = borrowed ? JSON.parse(borrowed) : [];
    if (!list.some((b: any) => b.id === bookId)) {
      const record = {
        id: bookId,
        borrowingId,
        title: bookDetails.title,
        author: bookDetails.author,
        coverUrl: bookDetails.coverUrl,
        category: bookDetails.category,
        borrowDate: borrowDate.toISOString(),
        dueDate: dueDate.toISOString(),
        status: "Borrowed",
        studentName,
        studentEmail,
      };
      list.push(record);
      localStorage.setItem("readspace_borrowed_books", JSON.stringify(list));

      // Sync to history as well
      const history = localStorage.getItem("readspace_borrow_history");
      const historyList = history ? JSON.parse(history) : [];
      const existingIdx = historyList.findIndex((h: any) => h.id === bookId && h.status === "Borrowed");
      if (existingIdx >= 0) {
        historyList[existingIdx] = record;
      } else {
        historyList.push(record);
      }
      localStorage.setItem("readspace_borrow_history", JSON.stringify(historyList));
    }
  } catch (e) {
    console.error("Error syncing borrowing to localStorage:", e);
  }

  if (shouldUseMock(userId)) return true;

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

    const history = localStorage.getItem("readspace_borrow_history");
    if (history) {
      const historyList = JSON.parse(history);
      const record = historyList.find((b: any) => b.id === bookId && b.status === "Borrowed");
      if (record) {
        record.status = "Returned";
        record.returnDate = new Date().toISOString();
        localStorage.setItem("readspace_borrow_history", JSON.stringify(historyList));
      }
    }
  } catch (e) {
    console.error("Error syncing return to localStorage:", e);
  }

  if (shouldUseMock(userId)) return true;

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

export async function adminReturnBook(borrowingId: string, bookId: string): Promise<boolean> {
  // Sync to localStorage
  try {
    // 1. Remove from active borrowings
    const borrowed = localStorage.getItem("readspace_borrowed_books");
    if (borrowed) {
      const list = JSON.parse(borrowed).filter((b: any) => b.id !== bookId);
      localStorage.setItem("readspace_borrowed_books", JSON.stringify(list));
    }

    // 2. Update status in history
    const history = localStorage.getItem("readspace_borrow_history");
    if (history) {
      const historyList = JSON.parse(history);
      const record = historyList.find((b: any) => (b.id === bookId || b.borrowingId === borrowingId) && b.status === "Borrowed");
      if (record) {
        record.status = "Returned";
        record.returnDate = new Date().toISOString();
        localStorage.setItem("readspace_borrow_history", JSON.stringify(historyList));
      }
    }
  } catch (e) {
    console.error("Error syncing admin return to localStorage:", e);
  }

  if (shouldUseMock()) return true;

  try {
    const { error } = await supabase
      .from("borrowings")
      .update({
        status: "Returned",
        return_date: new Date().toISOString(),
      })
      .eq("id", borrowingId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error admin returning book in Supabase:", error);
    return false;
  }
}
