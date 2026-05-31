export interface BukuAcakAuthor {
  name: string;
  url?: string;
}

export interface BukuAcakCategory {
  name: string;
  url?: string;
}

export interface BukuAcakDetails {
  isbn: string;
  price?: string;
  total_pages?: string;
  size?: string;
  published_date?: string;
  format?: string;
}

export interface BukuAcakTag {
  name: string;
  url?: string;
}

export interface BukuAcakBuyLink {
  store: string;
  url: string;
}

export interface BukuAcakBook {
  _id: string;
  title: string;
  cover_image: string;
  author: BukuAcakAuthor;
  category: BukuAcakCategory;
  summary: string;
  details: BukuAcakDetails;
  tags?: BukuAcakTag[];
  buy_links?: BukuAcakBuyLink[];
  publisher?: string;
}

export interface BukuAcakPagination {
  total_books: number;
  total_pages: number;
  current_page: number;
  limit: number;
}

export interface BukuAcakBooksResponse {
  books: BukuAcakBook[];
  pagination: BukuAcakPagination;
}

const BASE_URL = "https://api.bukuacak.shabsolute.tech/api/v1";

async function fetchWithTimeoutAndRetry(
  url: string,
  options: RequestInit = {},
  retries = 2,
  timeout = 8000
): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (err: any) {
      clearTimeout(id);
      const isLastAttempt = i === retries;
      if (isLastAttempt) {
        if (err.name === "AbortError") {
          throw new Error("Request timed out. Please check your internet connection.");
        }
        throw new Error(err.message || "Failed to communicate with BukuAcak API service.");
      }
      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, i)));
    }
  }
  throw new Error("API call failed after retries.");
}

export async function getBooks(params: {
  sort?: string;
  page?: number;
  year?: string;
  genre?: string;
  keyword?: string;
}): Promise<BukuAcakBooksResponse> {
  const query = new URLSearchParams();
  if (params.sort) query.set("sort", params.sort);
  if (params.page) query.set("page", String(params.page));
  if (params.year) query.set("year", params.year);
  if (params.genre) query.set("genre", params.genre);
  if (params.keyword) query.set("keyword", params.keyword);

  const res = await fetchWithTimeoutAndRetry(`${BASE_URL}/book?${query.toString()}`);
  return res.json();
}

export async function getBookById(id: string): Promise<BukuAcakBook> {
  const res = await fetchWithTimeoutAndRetry(`${BASE_URL}/book/${id}`);
  const data = await res.json();
  return data.book || data;
}

export async function getRandomBook(params: {
  year?: string;
  genre?: string;
  keyword?: string;
}): Promise<BukuAcakBook> {
  const query = new URLSearchParams();
  if (params.year) query.set("year", params.year);
  if (params.genre) query.set("genre", params.genre);
  if (params.keyword) query.set("keyword", params.keyword);

  const res = await fetchWithTimeoutAndRetry(`${BASE_URL}/random_book?${query.toString()}`);
  return res.json();
}

export async function getGenreStats(): Promise<Record<string, number>> {
  const res = await fetchWithTimeoutAndRetry(`${BASE_URL}/stats/genre`);
  return res.json();
}
