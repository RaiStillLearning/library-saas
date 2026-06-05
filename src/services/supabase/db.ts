import { supabase } from "./client";
import { getBookById } from "../api/books";

// ─── Borrowing Business Rules (matching apis-uprak) ──────────────────────────
export const BORROWING_RULES = {
  DURATION_DAYS: 14,
  LATE_FINE_AMOUNT: 30000,
  MAX_ACTIVE_BORROWINGS: 3,
  PENDING_EXPIRATION_DAYS: 7,
};

const isSupabaseConfigured = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "your-supabase-url" &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "your-supabase-anon-key"
);

export function safeGetItem(key: string, fallback: any = []): any {
  if (typeof window === "undefined") return fallback;
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    return JSON.parse(data);
  } catch (e) {
    console.error(`Failed to parse localStorage key "${key}":`, e);
    try {
      localStorage.removeItem(key);
    } catch {}
    return fallback;
  }
}

export function safeSetItem(key: string, value: any): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to write to localStorage key "${key}":`, e);
  }
}

function shouldUseMock(userId?: string): boolean {
  if (!isSupabaseConfigured) return true;
  if (userId && userId.startsWith("mock-")) return true;

  if (typeof window !== "undefined") {
    try {
      const hasMockSession =
        localStorage.getItem("readspace_mock_user") !== null ||
        document.cookie.includes("readspace_mock_session");
      if (hasMockSession) return true;
    } catch {
      return true;
    }
  }

  return false;
}

// ─── Per-user localStorage keys ──────────────────────────────────────────────
function savedKey(userId: string) {
  return `readspace_saved_books_${userId}`;
}
function borrowedKey(userId: string) {
  return `readspace_borrowed_books_${userId}`;
}
function historyKey(userId: string) {
  return `readspace_borrow_history_${userId}`;
}

// ─── ReadSpace Books mock storage keys ───────────────────────────────────────
const RS_BOOKS_KEY = "readspace_rs_books";
const RS_BORROWINGS_KEY = "readspace_rs_borrowings";

// ─── Favorites Operations ─────────────────────────────────────────────────────
export async function fetchFavorites(userId: string): Promise<string[]> {
  if (shouldUseMock(userId)) {
    const saved = localStorage.getItem(savedKey(userId));
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
    const saved = localStorage.getItem(savedKey(userId));
    return saved ? JSON.parse(saved) : [];
  }
}

export async function addFavorite(
  userId: string,
  bookId: string
): Promise<boolean> {
  // Always sync to localStorage as cache
  try {
    const saved = localStorage.getItem(savedKey(userId));
    const list: string[] = saved ? JSON.parse(saved) : [];
    if (!list.includes(bookId)) {
      list.push(bookId);
      localStorage.setItem(savedKey(userId), JSON.stringify(list));
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
    return true; // localStorage already updated
  }
}

export async function removeFavorite(
  userId: string,
  bookId: string
): Promise<boolean> {
  // Always sync to localStorage
  try {
    const saved = localStorage.getItem(savedKey(userId));
    let list: string[] = saved ? JSON.parse(saved) : [];
    list = list.filter((id) => id !== bookId);
    localStorage.setItem(savedKey(userId), JSON.stringify(list));
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
    return true; // localStorage already updated
  }
}

// ─── Borrowings Operations ────────────────────────────────────────────────────
export async function fetchBorrowings(userId: string): Promise<any[]> {
  if (shouldUseMock(userId)) {
    const borrowed = localStorage.getItem(borrowedKey(userId));
    return borrowed ? JSON.parse(borrowed) : [];
  }

  try {
    const { data, error } = await supabase
      .from("borrowings")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "Borrowed");

    if (error) throw error;
    if (!data || data.length === 0) return [];

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
        console.error(
          `Error loading book metadata for ID ${record.book_id}:`,
          err
        );
        return null;
      }
    });

    const results = await Promise.all(borrowingPromises);
    return results.filter((b) => b !== null);
  } catch (error) {
    console.error("Error fetching borrowings from Supabase:", error);
    const borrowed = localStorage.getItem(borrowedKey(userId));
    return borrowed ? JSON.parse(borrowed) : [];
  }
}

export async function fetchBorrowHistory(userId: string): Promise<any[]> {
  if (shouldUseMock(userId)) {
    const history = localStorage.getItem(historyKey(userId));
    if (!history) {
      const active = localStorage.getItem(borrowedKey(userId));
      if (active) {
        localStorage.setItem(historyKey(userId), active);
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
        console.error(
          `Error loading book metadata for ID ${record.book_id}:`,
          err
        );
        return null;
      }
    });

    const results = await Promise.all(borrowingPromises);
    return results.filter((b) => b !== null);
  } catch (error) {
    console.error("Error fetching borrow history from Supabase:", error);
    const history = localStorage.getItem(historyKey(userId));
    return history ? JSON.parse(history) : [];
  }
}

export async function fetchAllBorrowingsAdmin(): Promise<any[]> {
  if (shouldUseMock()) {
    // Aggregate all user histories from localStorage
    const allRecords: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("readspace_borrow_history_")) {
        try {
          const records = JSON.parse(localStorage.getItem(key) || "[]");
          allRecords.push(...records);
        } catch (e) {}
      }
    }
    return allRecords.map((record: any) => ({
      id:
        record.borrowingId ||
        record.id ||
        Math.random().toString(36).substr(2, 9),
      bookId: record.id,
      title: record.title,
      studentName: record.studentName || "Student",
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
      .select(
        `
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
      `
      )
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
        console.error(
          `Error loading book metadata for ID ${record.book_id}:`,
          err
        );
        return null;
      }
    });

    const results = await Promise.all(borrowingPromises);
    return results.filter((b) => b !== null);
  } catch (error) {
    console.error("Error fetching admin borrowings from Supabase:", error);
    const allRecords: any[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("readspace_borrow_history_")) {
        try {
          const records = JSON.parse(localStorage.getItem(key) || "[]");
          allRecords.push(...records);
        } catch (e) {}
      }
    }
    return allRecords.map((record: any) => ({
      id:
        record.borrowingId ||
        record.id ||
        Math.random().toString(36).substr(2, 9),
      bookId: record.id,
      title: record.title,
      studentName: record.studentName || "Student",
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
  bookDetails: {
    title: string;
    author: string;
    coverUrl: string;
    category: string;
  },
  userInfo?: { name?: string; email?: string }
): Promise<boolean> {
  const borrowDate = new Date();
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  let studentName = userInfo?.name || "Student";
  let studentEmail = userInfo?.email || "student@readspace.com";

  if (!userInfo?.name || !userInfo?.email) {
    try {
      const profileStr = localStorage.getItem("readspace_mock_profile");
      if (profileStr) {
        const p = JSON.parse(profileStr);
        if (!userInfo?.name) studentName = p.name || studentName;
        if (!userInfo?.email) studentEmail = p.email || studentEmail;
      }
    } catch (e) {}
  }

  const borrowingId = Math.random().toString(36).substring(2, 15);

  // Sync to per-user localStorage
  try {
    const borrowed = localStorage.getItem(borrowedKey(userId));
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
      localStorage.setItem(borrowedKey(userId), JSON.stringify(list));

      const history = localStorage.getItem(historyKey(userId));
      const historyList = history ? JSON.parse(history) : [];
      const existingIdx = historyList.findIndex(
        (h: any) => h.id === bookId && h.status === "Borrowed"
      );
      if (existingIdx >= 0) {
        historyList[existingIdx] = record;
      } else {
        historyList.push(record);
      }
      localStorage.setItem(historyKey(userId), JSON.stringify(historyList));
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
    return true; // localStorage already updated
  }
}

export async function returnBook(
  userId: string,
  bookId: string
): Promise<boolean> {
  // Sync to localStorage first
  try {
    const borrowed = localStorage.getItem(borrowedKey(userId));
    if (borrowed) {
      const list = JSON.parse(borrowed).filter((b: any) => b.id !== bookId);
      localStorage.setItem(borrowedKey(userId), JSON.stringify(list));
    }

    const history = localStorage.getItem(historyKey(userId));
    if (history) {
      const historyList = JSON.parse(history);
      const record = historyList.find(
        (b: any) => b.id === bookId && b.status === "Borrowed"
      );
      if (record) {
        record.status = "Returned";
        record.returnDate = new Date().toISOString();
        localStorage.setItem(historyKey(userId), JSON.stringify(historyList));
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
    return true; // localStorage already updated
  }
}

export async function adminReturnBook(
  borrowingId: string,
  bookId: string
): Promise<boolean> {
  // Admin can return any user's book — update all user keys in localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("readspace_borrowed_books_")) {
        const data = localStorage.getItem(key);
        if (data) {
          const list = JSON.parse(data).filter((b: any) => b.id !== bookId);
          localStorage.setItem(key, JSON.stringify(list));
        }
      }
      if (key && key.startsWith("readspace_borrow_history_")) {
        const data = localStorage.getItem(key);
        if (data) {
          const historyList = JSON.parse(data);
          const record = historyList.find(
            (b: any) =>
              (b.id === bookId || b.borrowingId === borrowingId) &&
              b.status === "Borrowed"
          );
          if (record) {
            record.status = "Returned";
            record.returnDate = new Date().toISOString();
            localStorage.setItem(key, JSON.stringify(historyList));
          }
        }
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
    return true;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── ReadSpace Books — Internal Inventory (Supabase + LocalStorage mock) ──
// ═══════════════════════════════════════════════════════════════════════════

export interface ReadSpaceBook {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  published_year?: number;
  description?: string;
  cover_url?: string;
  total_stock: number;
  available_stock: number;
  category?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ReadSpaceBorrowing {
  id: string;
  user_id: string;
  book_id: string;
  borrow_date: string;
  due_date?: string | null;
  return_date?: string | null;
  status: "pending" | "borrowed" | "returned" | "overdue" | "rejected" | "expired";
  borrow_code?: string;
  borrowed_at?: string | null;
  returned_at?: string | null;
  fine_amount?: number;
  fine_paid?: boolean;
  paid_at?: string | null;
  rejection_reason?: string | null;
  created_at?: string;
  // joined
  book?: ReadSpaceBook;
  student_name?: string;
  student_email?: string;
}

// Seed data for mock mode
const MOCK_BOOKS: ReadSpaceBook[] = [
  {
    id: "mock-rs-1",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    publisher: "Scribner",
    published_year: 1925,
    description: "A story of wealth, love, and the American Dream in the Jazz Age.",
    cover_url: "",
    total_stock: 3,
    available_stock: 3,
    category: "Fiction",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-rs-2",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780061935466",
    publisher: "HarperCollins",
    published_year: 1960,
    description: "A classic of American literature about racial injustice in the Deep South.",
    cover_url: "",
    total_stock: 5,
    available_stock: 5,
    category: "Fiction",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-rs-3",
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    publisher: "Signet Classic",
    published_year: 1949,
    description: "A dystopian social science fiction novel and cautionary tale.",
    cover_url: "",
    total_stock: 4,
    available_stock: 4,
    category: "Science Fiction",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-rs-4",
    title: "Clean Code",
    author: "Robert C. Martin",
    isbn: "9780132350884",
    publisher: "Prentice Hall",
    published_year: 2008,
    description: "A handbook of agile software craftsmanship.",
    cover_url: "",
    total_stock: 2,
    available_stock: 2,
    category: "Technology",
    created_at: new Date().toISOString(),
  },
  {
    id: "mock-rs-5",
    title: "Atomic Habits",
    author: "James Clear",
    isbn: "9780735211292",
    publisher: "Avery",
    published_year: 2018,
    description: "An easy and proven way to build good habits and break bad ones.",
    cover_url: "",
    total_stock: 3,
    available_stock: 3,
    category: "Self-Help",
    created_at: new Date().toISOString(),
  },
];

function getMockBooks(): ReadSpaceBook[] {
  if (typeof window === "undefined") return MOCK_BOOKS;
  try {
    const stored = localStorage.getItem(RS_BOOKS_KEY);
    if (stored) return JSON.parse(stored);
    localStorage.setItem(RS_BOOKS_KEY, JSON.stringify(MOCK_BOOKS));
    return MOCK_BOOKS;
  } catch {
    return MOCK_BOOKS;
  }
}

function saveMockBooks(books: ReadSpaceBook[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(RS_BOOKS_KEY, JSON.stringify(books));
  }
}

function getMockRsBorrowings(): ReadSpaceBorrowing[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RS_BORROWINGS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMockRsBorrowings(borrowings: ReadSpaceBorrowing[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(RS_BORROWINGS_KEY, JSON.stringify(borrowings));
  }
}

// ─── Mock Borrow Code Generator ──────────────────────────────────────────────
function generateMockBorrowCode(): string {
  if (typeof window === "undefined") return "BRW-0000-0001";
  let counter = parseInt(localStorage.getItem("readspace_borrow_counter") || "0");
  counter += 1;
  localStorage.setItem("readspace_borrow_counter", String(counter));
  const countStr = String(counter).padStart(4, "0");
  const year = new Date().getFullYear();
  return `BRW-${year}-${countStr}`;
}

// ─── Auto-update overdue borrowings (mock mode hook) ─────────────────────────
function updateOverdueBorrowings(borrowings: ReadSpaceBorrowing[]): ReadSpaceBorrowing[] {
  const todayStr = new Date().toISOString().split("T")[0];
  let changed = false;

  const updated = borrowings.map((b) => {
    if (b.status === "borrowed" && b.due_date && b.due_date < todayStr) {
      changed = true;
      return { ...b, status: "overdue" as const };
    }
    return b;
  });

  if (changed) {
    saveMockRsBorrowings(updated);
  }
  return updated;
}

// ─── Auto-expire stale pending requests (mock mode hook) ─────────────────────
function updatePendingExpirations(borrowings: ReadSpaceBorrowing[]): ReadSpaceBorrowing[] {
  const today = new Date();
  let changed = false;

  const updated = borrowings.map((b) => {
    if (b.status === "pending") {
      const createdDate = new Date(b.borrow_date);
      const diffTime = Math.abs(today.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > BORROWING_RULES.PENDING_EXPIRATION_DAYS) {
        changed = true;
        return { ...b, status: "expired" as const };
      }
    }
    return b;
  });

  if (changed) {
    saveMockRsBorrowings(updated);
  }
  return updated;
}

// ─── Calculate Outstanding Fines ─────────────────────────────────────────────
export async function calculateOutstandingFines(userId: string): Promise<number> {
  if (shouldUseMock(userId)) {
    const borrowings = getMockRsBorrowings();
    return borrowings
      .filter((b) => b.user_id === userId && (b.fine_amount || 0) > 0 && b.fine_paid === false)
      .reduce((sum, b) => sum + (b.fine_amount || 0), 0);
  }

  try {
    const { data, error } = await supabase
      .from("readspace_borrowings")
      .select("fine_amount")
      .eq("user_id", userId)
      .eq("fine_paid", false)
      .gt("fine_amount", 0);
    if (error) throw error;
    return (data || []).reduce((sum: number, b: any) => sum + (b.fine_amount || 0), 0);
  } catch (error) {
    console.error("Error calculating outstanding fines:", error);
    return 0;
  }
}

// ─── Fetch All ReadSpace Books ────────────────────────────────────────────────
export async function fetchReadSpaceBooks(): Promise<ReadSpaceBook[]> {
  if (shouldUseMock()) {
    return getMockBooks();
  }

  try {
    const { data, error } = await supabase
      .from("readspace_books")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching ReadSpace books:", error);
    return getMockBooks();
  }
}

// ─── Admin: Create a ReadSpace Book ──────────────────────────────────────────
export async function createReadSpaceBook(
  book: Omit<ReadSpaceBook, "id" | "created_at" | "updated_at">
): Promise<ReadSpaceBook | null> {
  if (shouldUseMock()) {
    const newBook: ReadSpaceBook = {
      ...book,
      id: `mock-rs-${Date.now()}`,
      available_stock: book.total_stock,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const books = getMockBooks();
    books.unshift(newBook);
    saveMockBooks(books);
    return newBook;
  }

  try {
    const { data, error } = await supabase
      .from("readspace_books")
      .insert({ ...book, available_stock: book.total_stock })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating ReadSpace book:", error);
    return null;
  }
}

// ─── Admin: Update a ReadSpace Book ──────────────────────────────────────────
export async function updateReadSpaceBook(
  id: string,
  updates: Partial<Omit<ReadSpaceBook, "id" | "created_at">>
): Promise<ReadSpaceBook | null> {
  if (shouldUseMock()) {
    const books = getMockBooks();
    const idx = books.findIndex((b) => b.id === id);
    if (idx === -1) return null;
    books[idx] = {
      ...books[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveMockBooks(books);
    return books[idx];
  }

  try {
    const { data, error } = await supabase
      .from("readspace_books")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating ReadSpace book:", error);
    return null;
  }
}

// ─── Admin: Delete a ReadSpace Book ──────────────────────────────────────────
export async function deleteReadSpaceBook(id: string): Promise<boolean> {
  if (shouldUseMock()) {
    // Check for active borrowings
    const borrowings = getMockRsBorrowings();
    const hasActive = borrowings.some(
      (b) => b.book_id === id && ["pending", "borrowed", "overdue"].includes(b.status)
    );
    if (hasActive) {
      throw new Error("Cannot delete book while there are active borrowing records.");
    }

    const books = getMockBooks().filter((b) => b.id !== id);
    saveMockBooks(books);
    // Clean up past borrowings for this book
    const cleanBorrowings = borrowings.filter((b) => b.book_id !== id);
    saveMockRsBorrowings(cleanBorrowings);
    return true;
  }

  try {
    // Check for active borrowings in Supabase
    const { count, error: countErr } = await supabase
      .from("readspace_borrowings")
      .select("*", { count: "exact", head: true })
      .eq("book_id", id)
      .in("status", ["pending", "borrowed", "overdue"]);
    if (countErr) throw countErr;
    if ((count || 0) > 0) {
      throw new Error("Cannot delete book while there are active borrowing records.");
    }

    const { error } = await supabase
      .from("readspace_books")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error("Error deleting ReadSpace book:", error);
    if (error?.message?.includes("Cannot delete")) throw error;
    return false;
  }
}

// ─── User: Borrow a ReadSpace Book ───────────────────────────────────────────
export async function borrowReadSpaceBook(
  userId: string,
  bookId: string,
  userInfo?: { name?: string; email?: string; approval_required?: boolean; status?: string }
): Promise<{ success: boolean; message: string; data?: ReadSpaceBorrowing }> {
  const approvalRequired = userInfo?.approval_required !== undefined ? userInfo.approval_required : true;
  const studentStatus = userInfo?.status || "active";

  // 1. Account status check
  if (studentStatus !== "active") {
    return { success: false, message: "Your account is not allowed to borrow books." };
  }

  // 2. Unpaid Fine Check
  const unpaidAmount = await calculateOutstandingFines(userId);
  if (unpaidAmount > 0) {
    return { success: false, message: "You must pay all outstanding fines before borrowing new books." };
  }

  if (shouldUseMock(userId)) {
    const books = getMockBooks();
    const bookIdx = books.findIndex((b) => b.id === bookId);
    if (bookIdx === -1) return { success: false, message: "Book not found." };
    const book = books[bookIdx];

    let borrowings = getMockRsBorrowings();
    borrowings = updatePendingExpirations(borrowings);
    borrowings = updateOverdueBorrowings(borrowings);

    // 3. Duplicate Borrow Protection
    const hasActive = borrowings.some(
      (b) => b.user_id === userId && b.book_id === bookId && ["pending", "borrowed", "overdue"].includes(b.status)
    );
    if (hasActive) {
      return { success: false, message: "You already have an active request for this book." };
    }

    // 4. Borrowing Limit Check
    const activeCount = borrowings.filter(
      (b) => b.user_id === userId && ["pending", "borrowed", "overdue"].includes(b.status)
    ).length;
    if (activeCount >= BORROWING_RULES.MAX_ACTIVE_BORROWINGS) {
      return { success: false, message: "You have reached the maximum borrowing limit." };
    }

    // 5. Stock Check
    if (book.available_stock <= 0) {
      return { success: false, message: "No copies available. Please check back later." };
    }

    // Generate borrow code
    const borrowCode = generateMockBorrowCode();
    const borrowDate = new Date();

    if (!approvalRequired) {
      // Direct checkout → decrement stock, set borrowed_at & due_date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + BORROWING_RULES.DURATION_DAYS);

      books[bookIdx].available_stock -= 1;
      saveMockBooks(books);

      const newBorrowing: ReadSpaceBorrowing = {
        id: `mock-rsb-${Date.now()}`,
        user_id: userId,
        book_id: bookId,
        borrow_date: borrowDate.toISOString().split("T")[0],
        due_date: dueDate.toISOString().split("T")[0],
        return_date: null,
        status: "borrowed",
        borrow_code: borrowCode,
        borrowed_at: borrowDate.toISOString(),
        returned_at: null,
        fine_amount: 0,
        fine_paid: false,
        paid_at: null,
        rejection_reason: null,
        created_at: borrowDate.toISOString(),
        student_name: userInfo?.name || "Student",
        student_email: userInfo?.email || "student@readspace.com",
        book,
      };

      borrowings.push(newBorrowing);
      saveMockRsBorrowings(borrowings);

      return { success: true, message: "Book borrowed successfully!", data: newBorrowing };
    } else {
      // Pending request → do NOT change stock, due_date is null
      const newRequest: ReadSpaceBorrowing = {
        id: `mock-rsb-${Date.now()}`,
        user_id: userId,
        book_id: bookId,
        borrow_date: borrowDate.toISOString().split("T")[0],
        due_date: null,
        return_date: null,
        status: "pending",
        borrow_code: borrowCode,
        borrowed_at: null,
        returned_at: null,
        fine_amount: 0,
        fine_paid: false,
        paid_at: null,
        rejection_reason: null,
        created_at: borrowDate.toISOString(),
        student_name: userInfo?.name || "Student",
        student_email: userInfo?.email || "student@readspace.com",
        book,
      };

      borrowings.push(newRequest);
      saveMockRsBorrowings(borrowings);

      return { success: true, message: "Borrow request submitted! Waiting for admin approval.", data: newRequest };
    }
  }

  // ─── Supabase Mode ───
  try {
    // 3. Duplicate Borrow Protection
    const { count: dupCount, error: dupErr } = await supabase
      .from("readspace_borrowings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .in("status", ["pending", "borrowed", "overdue"]);
    if (dupErr) throw dupErr;
    if ((dupCount || 0) > 0) {
      return { success: false, message: "You already have an active request for this book." };
    }

    // 4. Borrowing Limit Check
    const { count: activeCount, error: limitErr } = await supabase
      .from("readspace_borrowings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["pending", "borrowed", "overdue"]);
    if (limitErr) throw limitErr;
    if ((activeCount || 0) >= BORROWING_RULES.MAX_ACTIVE_BORROWINGS) {
      return { success: false, message: "You have reached the maximum borrowing limit." };
    }

    // 5. Stock Check
    const { data: bookData, error: bookErr } = await supabase
      .from("readspace_books")
      .select("available_stock")
      .eq("id", bookId)
      .single();
    if (bookErr) throw bookErr;
    if (!bookData || bookData.available_stock <= 0) {
      return { success: false, message: "No copies available. Please check back later." };
    }

    const borrowDate = new Date();

    if (!approvalRequired) {
      // Direct checkout
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + BORROWING_RULES.DURATION_DAYS);

      await supabase
        .from("readspace_books")
        .update({ available_stock: bookData.available_stock - 1 })
        .eq("id", bookId);

      const { data, error } = await supabase
        .from("readspace_borrowings")
        .insert({
          user_id: userId,
          book_id: bookId,
          borrow_date: borrowDate.toISOString().split("T")[0],
          due_date: dueDate.toISOString().split("T")[0],
          status: "borrowed",
          borrowed_at: borrowDate.toISOString(),
          fine_amount: 0,
          fine_paid: false,
        })
        .select()
        .single();

      if (error) {
        // Rollback stock
        await supabase
          .from("readspace_books")
          .update({ available_stock: bookData.available_stock })
          .eq("id", bookId);
        throw error;
      }

      return { success: true, message: "Book borrowed successfully!", data };
    } else {
      // Pending request → do NOT generate borrow_code in JS; let DB trigger do it
      const { data, error } = await supabase
        .from("readspace_borrowings")
        .insert({
          user_id: userId,
          book_id: bookId,
          borrow_date: borrowDate.toISOString().split("T")[0],
          due_date: null,
          status: "pending",
          borrowed_at: null,
          fine_amount: 0,
          fine_paid: false,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, message: "Borrow request submitted! Waiting for admin approval.", data };
    }
  } catch (error) {
    console.error("Error borrowing ReadSpace book:", error);
    return { success: false, message: "Failed to borrow book. Please try again." };
  }
}

// ─── User: Return a ReadSpace Book ───────────────────────────────────────────
export async function returnReadSpaceBook(
  userId: string,
  bookId: string,
  borrowingId?: string
): Promise<boolean> {
  const todayStr = new Date().toISOString().split("T")[0];
  const returnedAt = new Date().toISOString();

  if (shouldUseMock(userId)) {
    const borrowings = getMockRsBorrowings();
    const idx = borrowingId
      ? borrowings.findIndex((b) => b.id === borrowingId)
      : borrowings.findIndex(
          (b) => b.user_id === userId && b.book_id === bookId && ["borrowed", "overdue"].includes(b.status)
        );
    if (idx !== -1) {
      const borrowing = borrowings[idx];
      const isLate = borrowing.due_date ? todayStr > borrowing.due_date : false;
      let fineAmount = borrowing.fine_amount || 0;
      let finePaid = borrowing.fine_paid || false;

      if (isLate && fineAmount === 0) {
        fineAmount = BORROWING_RULES.LATE_FINE_AMOUNT;
        finePaid = false;
      }

      borrowings[idx] = {
        ...borrowing,
        status: "returned",
        return_date: todayStr,
        returned_at: returnedAt,
        fine_amount: fineAmount,
        fine_paid: finePaid,
      };
      saveMockRsBorrowings(borrowings);
    }

    // Restore stock
    const books = getMockBooks();
    const bookIdx = books.findIndex((b) => b.id === bookId);
    if (bookIdx !== -1) {
      books[bookIdx].available_stock = Math.min(
        books[bookIdx].total_stock,
        books[bookIdx].available_stock + 1
      );
      saveMockBooks(books);
    }
    return true;
  }

  try {
    // Fetch the borrowing record first
    let borrowing: any = null;
    if (borrowingId) {
      const { data } = await supabase
        .from("readspace_borrowings")
        .select("*")
        .eq("id", borrowingId)
        .single();
      borrowing = data;
    } else {
      const { data } = await supabase
        .from("readspace_borrowings")
        .select("*")
        .eq("user_id", userId)
        .eq("book_id", bookId)
        .in("status", ["borrowed", "overdue"])
        .single();
      borrowing = data;
    }

    if (!borrowing) throw new Error("Borrowing record not found");

    const isLate = borrowing.due_date ? todayStr > borrowing.due_date : false;
    let fineAmount = borrowing.fine_amount || 0;
    let finePaid = borrowing.fine_paid || false;

    if (isLate && fineAmount === 0) {
      fineAmount = BORROWING_RULES.LATE_FINE_AMOUNT;
      finePaid = false;
    }

    const { error: returnError } = await supabase
      .from("readspace_borrowings")
      .update({
        status: "returned",
        return_date: todayStr,
        returned_at: returnedAt,
        fine_amount: fineAmount,
        fine_paid: finePaid,
      })
      .eq("id", borrowing.id);
    if (returnError) throw returnError;

    // Restore stock
    const { data: bookData } = await supabase
      .from("readspace_books")
      .select("available_stock, total_stock")
      .eq("id", bookId)
      .single();

    if (bookData) {
      await supabase
        .from("readspace_books")
        .update({
          available_stock: Math.min(bookData.total_stock, bookData.available_stock + 1),
        })
        .eq("id", bookId);
    }

    return true;
  } catch (error) {
    console.error("Error returning ReadSpace book:", error);
    return false;
  }
}

// ─── User: Fetch My ReadSpace Borrowings ─────────────────────────────────────
export async function fetchMyReadSpaceBorrowings(
  userId: string
): Promise<ReadSpaceBorrowing[]> {
  if (shouldUseMock(userId)) {
    let borrowings = getMockRsBorrowings().filter((b) => b.user_id === userId);
    borrowings = updatePendingExpirations(borrowings.length > 0 ? getMockRsBorrowings() : []).filter((b) => b.user_id === userId);
    borrowings = updateOverdueBorrowings(getMockRsBorrowings()).filter((b) => b.user_id === userId);
    const books = getMockBooks();
    return borrowings.map((b) => ({
      ...b,
      book: books.find((bk) => bk.id === b.book_id),
    }));
  }

  try {
    const { data, error } = await supabase
      .from("readspace_borrowings")
      .select(`*, book:readspace_books(*)`)
      .eq("user_id", userId)
      .order("borrow_date", { ascending: false });

    if (error) throw error;
    return (data || []) as ReadSpaceBorrowing[];
  } catch (error) {
    console.error("Error fetching user ReadSpace borrowings:", error);
    return [];
  }
}

// ─── Admin: Fetch All ReadSpace Borrowings ───────────────────────────────────
export async function fetchAllReadSpaceBorrowingsAdmin(): Promise<ReadSpaceBorrowing[]> {
  if (shouldUseMock()) {
    let borrowings = getMockRsBorrowings();
    borrowings = updatePendingExpirations(borrowings);
    borrowings = updateOverdueBorrowings(borrowings);
    const books = getMockBooks();
    return borrowings.map((b) => ({
      ...b,
      book: books.find((bk) => bk.id === b.book_id),
    }));
  }

  try {
    const { data, error } = await supabase
      .from("readspace_borrowings")
      .select(
        `
        *,
        book:readspace_books(*),
        profiles(name, email)
      `
      )
      .order("borrow_date", { ascending: false });

    if (error) throw error;

    return (data || []).map((record: any) => ({
      ...record,
      student_name: record.profiles?.name || "Unknown Student",
      student_email: record.profiles?.email || "Unknown Email",
    })) as ReadSpaceBorrowing[];
  } catch (error) {
    console.error("Error fetching admin ReadSpace borrowings:", error);
    return [];
  }
}

// ─── Admin: Return any user's ReadSpace Book ─────────────────────────────────
export async function adminReturnReadSpaceBook(
  borrowingId: string,
  bookId: string
): Promise<boolean> {
  const todayStr = new Date().toISOString().split("T")[0];
  const returnedAt = new Date().toISOString();

  if (shouldUseMock()) {
    const borrowings = getMockRsBorrowings();
    const idx = borrowings.findIndex((b) => b.id === borrowingId);
    if (idx !== -1) {
      const borrowing = borrowings[idx];
      if (borrowing.status === "returned") {
        throw new Error("Book has already been returned.");
      }

      const isLate = borrowing.due_date ? todayStr > borrowing.due_date : false;
      let fineAmount = borrowing.fine_amount || 0;
      let finePaid = borrowing.fine_paid || false;

      if (isLate && fineAmount === 0) {
        fineAmount = BORROWING_RULES.LATE_FINE_AMOUNT;
        finePaid = false;
      }

      borrowings[idx] = {
        ...borrowing,
        status: "returned",
        return_date: todayStr,
        returned_at: returnedAt,
        fine_amount: fineAmount,
        fine_paid: finePaid,
      };
      saveMockRsBorrowings(borrowings);
    }

    // Restore stock
    const books = getMockBooks();
    const bookIdx = books.findIndex((b) => b.id === bookId);
    if (bookIdx !== -1) {
      books[bookIdx].available_stock = Math.min(
        books[bookIdx].total_stock,
        books[bookIdx].available_stock + 1
      );
      saveMockBooks(books);
    }
    return true;
  }

  try {
    // Fetch borrowing first to check late status
    const { data: borrowing } = await supabase
      .from("readspace_borrowings")
      .select("*")
      .eq("id", borrowingId)
      .single();

    if (!borrowing) throw new Error("Borrowing record not found.");
    if (borrowing.status === "returned") throw new Error("Book has already been returned.");

    const isLate = borrowing.due_date ? todayStr > borrowing.due_date : false;
    let fineAmount = borrowing.fine_amount || 0;
    let finePaid = borrowing.fine_paid || false;

    if (isLate && fineAmount === 0) {
      fineAmount = BORROWING_RULES.LATE_FINE_AMOUNT;
      finePaid = false;
    }

    const { error: returnError } = await supabase
      .from("readspace_borrowings")
      .update({
        status: "returned",
        return_date: todayStr,
        returned_at: returnedAt,
        fine_amount: fineAmount,
        fine_paid: finePaid,
      })
      .eq("id", borrowingId);

    if (returnError) throw returnError;

    const { data: bookData } = await supabase
      .from("readspace_books")
      .select("available_stock, total_stock")
      .eq("id", bookId)
      .single();

    if (bookData) {
      await supabase
        .from("readspace_books")
        .update({
          available_stock: Math.min(bookData.total_stock, bookData.available_stock + 1),
        })
        .eq("id", bookId);
    }

    return true;
  } catch (error: any) {
    console.error("Error admin returning ReadSpace book:", error);
    if (error?.message?.includes("already been returned")) throw error;
    return false;
  }
}

// ─── Admin: Approve a ReadSpace Borrowing ────────────────────────────────────
export async function approveReadSpaceBorrowing(
  borrowingId: string
): Promise<{ success: boolean; message: string; data?: ReadSpaceBorrowing }> {
  const borrowedAt = new Date().toISOString();
  const dueDate = new Date(Date.now() + BORROWING_RULES.DURATION_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  if (shouldUseMock()) {
    const borrowings = getMockRsBorrowings();
    const books = getMockBooks();

    const borrowIndex = borrowings.findIndex((b) => b.id === borrowingId);
    if (borrowIndex === -1) return { success: false, message: "Borrowing record not found." };
    const borrowing = borrowings[borrowIndex];
    if (borrowing.status !== "pending") return { success: false, message: "Only pending requests can be approved." };

    const bookIndex = books.findIndex((b) => b.id === borrowing.book_id);
    if (bookIndex === -1) return { success: false, message: "Book not found." };
    const book = books[bookIndex];

    // ─── Revalidation Check ───
    // Check outstanding fines
    const unpaidFines = borrowings
      .filter((b) => b.user_id === borrowing.user_id && (b.fine_amount || 0) > 0 && b.fine_paid === false)
      .reduce((sum, b) => sum + (b.fine_amount || 0), 0);
    if (unpaidFines > 0) {
      borrowings[borrowIndex] = {
        ...borrowing,
        status: "rejected",
        rejection_reason: "Outstanding fines must be paid first.",
      };
      saveMockRsBorrowings(borrowings);
      return { success: false, message: "Auto-rejected: Student has outstanding fines." };
    }

    // Check active borrowing limit
    const activeCount = borrowings.filter(
      (b) =>
        b.user_id === borrowing.user_id &&
        b.id !== borrowingId &&
        ["borrowed", "overdue"].includes(b.status)
    ).length;
    if (activeCount >= BORROWING_RULES.MAX_ACTIVE_BORROWINGS) {
      borrowings[borrowIndex] = {
        ...borrowing,
        status: "rejected",
        rejection_reason: "Maximum borrowing limit reached.",
      };
      saveMockRsBorrowings(borrowings);
      return { success: false, message: "Auto-rejected: Student has reached maximum borrowing limit." };
    }

    // Check stock
    if (book.available_stock <= 0) {
      borrowings[borrowIndex] = {
        ...borrowing,
        status: "rejected",
        rejection_reason: "Book is out of stock.",
      };
      saveMockRsBorrowings(borrowings);
      return { success: false, message: "Auto-rejected: Book is out of stock." };
    }

    // All checks passed → approve
    books[bookIndex].available_stock -= 1;
    saveMockBooks(books);

    borrowings[borrowIndex] = {
      ...borrowing,
      status: "borrowed",
      borrowed_at: borrowedAt,
      due_date: dueDate,
    };
    saveMockRsBorrowings(borrowings);

    return { success: true, message: "Borrowing approved successfully!", data: borrowings[borrowIndex] };
  }

  // ─── Supabase Mode ───
  try {
    const { data: borrowing, error: bErr } = await supabase
      .from("readspace_borrowings")
      .select("*")
      .eq("id", borrowingId)
      .single();
    if (bErr) throw bErr;
    if (borrowing.status !== "pending") {
      return { success: false, message: "Only pending requests can be approved." };
    }

    // Revalidation: check fines
    const unpaidFines = await calculateOutstandingFines(borrowing.user_id);
    if (unpaidFines > 0) {
      await supabase
        .from("readspace_borrowings")
        .update({ status: "rejected", rejection_reason: "Outstanding fines must be paid first." })
        .eq("id", borrowingId);
      return { success: false, message: "Auto-rejected: Student has outstanding fines." };
    }

    // Revalidation: check borrowing limit
    const { count: activeCount } = await supabase
      .from("readspace_borrowings")
      .select("*", { count: "exact", head: true })
      .eq("user_id", borrowing.user_id)
      .in("status", ["borrowed", "overdue"]);
    if ((activeCount || 0) >= BORROWING_RULES.MAX_ACTIVE_BORROWINGS) {
      await supabase
        .from("readspace_borrowings")
        .update({ status: "rejected", rejection_reason: "Maximum borrowing limit reached." })
        .eq("id", borrowingId);
      return { success: false, message: "Auto-rejected: Student has reached maximum borrowing limit." };
    }

    // Revalidation: check stock
    const { data: book } = await supabase
      .from("readspace_books")
      .select("available_stock")
      .eq("id", borrowing.book_id)
      .single();
    if (!book || book.available_stock <= 0) {
      await supabase
        .from("readspace_borrowings")
        .update({ status: "rejected", rejection_reason: "Book is out of stock." })
        .eq("id", borrowingId);
      return { success: false, message: "Auto-rejected: Book is out of stock." };
    }

    // Approve
    const { data, error } = await supabase
      .from("readspace_borrowings")
      .update({
        status: "borrowed",
        borrowed_at: borrowedAt,
        due_date: dueDate,
      })
      .eq("id", borrowingId)
      .select()
      .single();
    if (error) throw error;

    // Decrement stock
    await supabase
      .from("readspace_books")
      .update({ available_stock: book.available_stock - 1 })
      .eq("id", borrowing.book_id);

    return { success: true, message: "Borrowing approved successfully!", data };
  } catch (error) {
    console.error("Error approving ReadSpace borrowing:", error);
    return { success: false, message: "Failed to approve borrowing." };
  }
}

// ─── Admin: Reject a ReadSpace Borrowing ─────────────────────────────────────
export async function rejectReadSpaceBorrowing(
  borrowingId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  const rejectionReason = reason || "Rejected by admin.";

  if (shouldUseMock()) {
    const borrowings = getMockRsBorrowings();
    const borrowIndex = borrowings.findIndex((b) => b.id === borrowingId);
    if (borrowIndex === -1) return { success: false, message: "Borrowing record not found." };
    const borrowing = borrowings[borrowIndex];
    if (borrowing.status !== "pending") return { success: false, message: "Only pending requests can be rejected." };

    borrowings[borrowIndex] = {
      ...borrowing,
      status: "rejected",
      rejection_reason: rejectionReason,
      return_date: new Date().toISOString().split("T")[0],
    };
    saveMockRsBorrowings(borrowings);
    return { success: true, message: "Borrowing request rejected." };
  }

  try {
    const { data: borrowing, error: bErr } = await supabase
      .from("readspace_borrowings")
      .select("status")
      .eq("id", borrowingId)
      .single();
    if (bErr) throw bErr;
    if (borrowing.status !== "pending") {
      return { success: false, message: "Only pending requests can be rejected." };
    }

    const { error } = await supabase
      .from("readspace_borrowings")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
        return_date: new Date().toISOString().split("T")[0],
      })
      .eq("id", borrowingId);
    if (error) throw error;

    return { success: true, message: "Borrowing request rejected." };
  } catch (error) {
    console.error("Error rejecting ReadSpace borrowing:", error);
    return { success: false, message: "Failed to reject borrowing." };
  }
}

// ─── Admin: Pay Fine for a ReadSpace Borrowing ───────────────────────────────
export async function payReadSpaceFine(
  borrowingId: string
): Promise<{ success: boolean; message: string }> {
  if (shouldUseMock()) {
    const borrowings = getMockRsBorrowings();
    const borrowIndex = borrowings.findIndex((b) => b.id === borrowingId);
    if (borrowIndex === -1) return { success: false, message: "Borrowing record not found." };
    const borrowing = borrowings[borrowIndex];

    if (!borrowing.fine_amount || borrowing.fine_amount <= 0) {
      return { success: false, message: "No fine to pay." };
    }
    if (borrowing.fine_paid) {
      return { success: false, message: "Fine has already been paid." };
    }

    borrowings[borrowIndex] = {
      ...borrowing,
      fine_paid: true,
      paid_at: new Date().toISOString(),
    };
    saveMockRsBorrowings(borrowings);
    return { success: true, message: "Fine marked as paid." };
  }

  try {
    const { data: borrowing, error: bErr } = await supabase
      .from("readspace_borrowings")
      .select("fine_amount, fine_paid")
      .eq("id", borrowingId)
      .single();
    if (bErr) throw bErr;

    if (!borrowing.fine_amount || borrowing.fine_amount <= 0) {
      return { success: false, message: "No fine to pay." };
    }
    if (borrowing.fine_paid) {
      return { success: false, message: "Fine has already been paid." };
    }

    const { error } = await supabase
      .from("readspace_borrowings")
      .update({
        fine_paid: true,
        paid_at: new Date().toISOString(),
      })
      .eq("id", borrowingId);
    if (error) throw error;

    return { success: true, message: "Fine marked as paid." };
  } catch (error) {
    console.error("Error paying ReadSpace fine:", error);
    return { success: false, message: "Failed to process fine payment." };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── OpenLibrary — Reading History ────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export interface ReadingHistoryEntry {
  id?: string;
  user_id?: string;
  work_id: string;
  book_title: string;
  book_cover?: string;
  book_author?: string;
  edition_id?: string;
  last_opened_at?: string;
  created_at?: string;
}

const RH_KEY = "readspace_reading_history";

function getMockReadingHistory(): ReadingHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RH_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMockReadingHistory(entries: ReadingHistoryEntry[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(RH_KEY, JSON.stringify(entries));
  }
}

export async function fetchReadingHistory(
  userId: string
): Promise<ReadingHistoryEntry[]> {
  if (shouldUseMock(userId)) {
    const all = getMockReadingHistory().filter((e) => e.user_id === userId);
    return all.sort(
      (a, b) =>
        new Date(b.last_opened_at || 0).getTime() -
        new Date(a.last_opened_at || 0).getTime()
    );
  }

  try {
    const { data, error } = await supabase
      .from("reading_history")
      .select("*")
      .eq("user_id", userId)
      .order("last_opened_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching reading history:", error);
    return getMockReadingHistory().filter((e) => e.user_id === userId);
  }
}

export async function upsertReadingHistory(
  userId: string,
  entry: Omit<ReadingHistoryEntry, "id" | "user_id" | "created_at">
): Promise<boolean> {
  const now = new Date().toISOString();

  if (shouldUseMock(userId)) {
    const all = getMockReadingHistory();
    const idx = all.findIndex(
      (e) => e.user_id === userId && e.work_id === entry.work_id
    );
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...entry, last_opened_at: now };
    } else {
      all.unshift({
        id: `mock-rh-${Date.now()}`,
        user_id: userId,
        ...entry,
        last_opened_at: now,
        created_at: now,
      });
    }
    saveMockReadingHistory(all);
    return true;
  }

  try {
    const { error } = await supabase.from("reading_history").upsert(
      {
        user_id: userId,
        ...entry,
        last_opened_at: now,
      },
      { onConflict: "user_id,work_id" }
    );
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error upserting reading history:", error);
    return false;
  }
}

export async function deleteReadingHistoryEntry(
  userId: string,
  workId: string
): Promise<boolean> {
  if (shouldUseMock(userId)) {
    const filtered = getMockReadingHistory().filter(
      (e) => !(e.user_id === userId && e.work_id === workId)
    );
    saveMockReadingHistory(filtered);
    return true;
  }

  try {
    const { error } = await supabase
      .from("reading_history")
      .delete()
      .eq("user_id", userId)
      .eq("work_id", workId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting reading history entry:", error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── OpenLibrary — Reading Lists ──────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export type ReadingListType = "want_to_read" | "currently_reading" | "finished";

export interface ReadingListEntry {
  id?: string;
  user_id?: string;
  work_id: string;
  book_title: string;
  book_cover?: string;
  book_author?: string;
  list_type: ReadingListType;
  added_at?: string;
}

const RL_KEY = "readspace_reading_list";

function getMockReadingList(): ReadingListEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(RL_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMockReadingList(entries: ReadingListEntry[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(RL_KEY, JSON.stringify(entries));
  }
}

export async function fetchReadingList(
  userId: string,
  listType?: ReadingListType
): Promise<ReadingListEntry[]> {
  if (shouldUseMock(userId)) {
    const all = getMockReadingList().filter((e) => e.user_id === userId);
    return listType ? all.filter((e) => e.list_type === listType) : all;
  }

  try {
    let query = supabase
      .from("reading_lists")
      .select("*")
      .eq("user_id", userId)
      .order("added_at", { ascending: false });

    if (listType) query = query.eq("list_type", listType);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as ReadingListEntry[];
  } catch (error) {
    console.error("Error fetching reading list:", error);
    const all = getMockReadingList().filter((e) => e.user_id === userId);
    return listType ? all.filter((e) => e.list_type === listType) : all;
  }
}

export async function upsertReadingListItem(
  userId: string,
  entry: Omit<ReadingListEntry, "id" | "user_id" | "added_at">
): Promise<boolean> {
  const now = new Date().toISOString();

  if (shouldUseMock(userId)) {
    const all = getMockReadingList();
    const idx = all.findIndex(
      (e) => e.user_id === userId && e.work_id === entry.work_id
    );
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...entry, added_at: now };
    } else {
      all.unshift({
        id: `mock-rl-${Date.now()}`,
        user_id: userId,
        ...entry,
        added_at: now,
      });
    }
    saveMockReadingList(all);
    return true;
  }

  try {
    const { error } = await supabase.from("reading_lists").upsert(
      { user_id: userId, ...entry, added_at: now },
      { onConflict: "user_id,work_id" }
    );
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error upserting reading list item:", error);
    return false;
  }
}

export async function removeFromReadingList(
  userId: string,
  workId: string
): Promise<boolean> {
  if (shouldUseMock(userId)) {
    const filtered = getMockReadingList().filter(
      (e) => !(e.user_id === userId && e.work_id === workId)
    );
    saveMockReadingList(filtered);
    return true;
  }

  try {
    const { error } = await supabase
      .from("reading_lists")
      .delete()
      .eq("user_id", userId)
      .eq("work_id", workId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error removing reading list item:", error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ─── Activity Timeline ────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════

export type ActivityType =
  | "borrowed"
  | "returned"
  | "started_reading"
  | "added_to_list"
  | "finished_reading";

export interface ActivityEntry {
  id?: string;
  user_id?: string;
  type: ActivityType;
  book_title?: string;
  book_cover?: string;
  metadata?: Record<string, any>;
  created_at?: string;
}

const ACT_KEY = "readspace_activities";

function getMockActivities(userId: string): ActivityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(`${ACT_KEY}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMockActivities(userId: string, entries: ActivityEntry[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`${ACT_KEY}_${userId}`, JSON.stringify(entries));
  }
}

export async function logActivity(
  userId: string,
  entry: Omit<ActivityEntry, "id" | "user_id" | "created_at">
): Promise<void> {
  const now = new Date().toISOString();

  if (shouldUseMock(userId)) {
    const all = getMockActivities(userId);
    all.unshift({
      id: `mock-act-${Date.now()}`,
      user_id: userId,
      ...entry,
      created_at: now,
    });
    // Keep last 100 activities
    saveMockActivities(userId, all.slice(0, 100));
    return;
  }

  try {
    await supabase.from("activities").insert({
      user_id: userId,
      ...entry,
      created_at: now,
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

export async function fetchActivityTimeline(
  userId: string,
  limit = 20
): Promise<ActivityEntry[]> {
  if (shouldUseMock(userId)) {
    return getMockActivities(userId).slice(0, limit);
  }

  try {
    const { data, error } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as ActivityEntry[];
  } catch (error) {
    console.error("Error fetching activity timeline:", error);
    return getMockActivities(userId).slice(0, limit);
  }
}

// ─── Profile / Student Management Services ────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: "student" | "admin";
  created_at?: string;
  approval_required?: boolean;
  status?: "active" | "suspended" | "graduated";
}

function getMockProfiles(): Profile[] {
  if (typeof window === "undefined") return [];
  const listStr = localStorage.getItem("readspace_profiles_list");
  if (listStr) {
    try {
      return JSON.parse(listStr);
    } catch {
      // recovery
    }
  }
  const list: Profile[] = [
    {
      id: "mock-admin-id",
      email: "admin@readspace.com",
      name: "Admin Manager",
      role: "admin",
      avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&h=256&fit=crop",
      approval_required: false,
      status: "active",
      created_at: new Date().toISOString(),
    },
    {
      id: "mock-student-id",
      email: "student@readspace.com",
      name: "John Doe",
      role: "student",
      avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=256&h=256&fit=crop",
      approval_required: true,
      status: "active",
      created_at: new Date().toISOString(),
    },
    {
      id: "std-3",
      email: "budi.santoso@readspace.edu",
      name: "Budi Santoso",
      role: "student",
      approval_required: true,
      status: "suspended",
      created_at: new Date().toISOString(),
    },
    {
      id: "std-4",
      email: "siti.rahma@readspace.edu",
      name: "Siti Rahma",
      role: "student",
      approval_required: true,
      status: "active",
      created_at: new Date().toISOString(),
    }
  ];
  localStorage.setItem("readspace_profiles_list", JSON.stringify(list));
  return list;
}

function saveMockProfiles(profiles: Profile[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem("readspace_profiles_list", JSON.stringify(profiles));
  }
}

export async function fetchAllProfilesAdmin(): Promise<Profile[]> {
  if (shouldUseMock()) {
    return getMockProfiles();
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return (data || []) as Profile[];
  } catch (error) {
    console.error("Error fetching profiles:", error);
    return getMockProfiles();
  }
}

export async function updateProfileAdmin(
  profileId: string,
  updates: Partial<Profile>
): Promise<boolean> {
  if (shouldUseMock()) {
    const profiles = getMockProfiles();
    const idx = profiles.findIndex((p) => p.id === profileId);
    if (idx === -1) return false;
    profiles[idx] = { ...profiles[idx], ...updates };
    saveMockProfiles(profiles);

    // Also update logged-in user profile if it's the active one
    const currentMockProfileStr = localStorage.getItem("readspace_mock_profile");
    if (currentMockProfileStr) {
      try {
        const currentProfile = JSON.parse(currentMockProfileStr);
        if (currentProfile.id === profileId) {
          localStorage.setItem("readspace_mock_profile", JSON.stringify(profiles[idx]));
        }
      } catch {}
    }
    return true;
  }

  try {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", profileId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating profile:", error);
    return false;
  }
}

export async function deleteProfileAdmin(profileId: string): Promise<{ success: boolean; message: string }> {
  if (shouldUseMock()) {
    const borrowings = getMockRsBorrowings();
    const activeLoans = borrowings.filter(
      (b) => b.user_id === profileId && ["pending", "borrowed", "overdue"].includes(b.status)
    );
    if (activeLoans.length > 0) {
      return {
        success: false,
        message: "Cannot delete student with active borrowings. Mark them returned or reject pending requests first.",
      };
    }
    const outstandingFines = borrowings
      .filter((b) => b.user_id === profileId && b.fine_amount && b.fine_amount > 0 && !b.fine_paid)
      .reduce((sum, b) => sum + (b.fine_amount || 0), 0);
    if (outstandingFines > 0) {
      return {
        success: false,
        message: `Cannot delete student with outstanding fines (Rp ${outstandingFines.toLocaleString()}). Mark the fine as paid first.`,
      };
    }

    const profiles = getMockProfiles();
    const updated = profiles.filter((p) => p.id !== profileId);
    saveMockProfiles(updated);
    return { success: true, message: "Student deleted successfully." };
  }

  try {
    // 1. Check active borrowings in Supabase
    const { data: activeLoans, error: activeErr } = await supabase
      .from("readspace_borrowings")
      .select("id")
      .eq("user_id", profileId)
      .in("status", ["pending", "borrowed", "overdue"]);
    if (activeErr) throw activeErr;
    if (activeLoans && activeLoans.length > 0) {
      return {
        success: false,
        message: "Cannot delete student with active borrowings. Mark them returned or reject pending requests first.",
      };
    }

    // 2. Check unpaid fines in Supabase
    const { data: unpaidFines, error: finesErr } = await supabase
      .from("readspace_borrowings")
      .select("fine_amount")
      .eq("user_id", profileId)
      .eq("fine_paid", false)
      .gt("fine_amount", 0);
    if (finesErr) throw finesErr;
    if (unpaidFines && unpaidFines.length > 0) {
      const outstandingFines = unpaidFines.reduce((sum, b) => sum + (b.fine_amount || 0), 0);
      return {
        success: false,
        message: `Cannot delete student with outstanding fines (Rp ${outstandingFines.toLocaleString()}). Mark the fine as paid first.`,
      };
    }

    const { error: deleteErr } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profileId);
    if (deleteErr) throw deleteErr;

    return { success: true, message: "Student deleted successfully." };
  } catch (error) {
    console.error("Error deleting profile:", error);
    return { success: false, message: "An error occurred while deleting the student profile." };
  }
}
