// ─────────────────────────────────────────────────────────────────────────────
// OpenLibrary API Service
// Base: https://openlibrary.org
// All fetches are read-only. No borrowing, no CRUD.
// ─────────────────────────────────────────────────────────────────────────────

const OL_BASE = "https://openlibrary.org";
const OL_COVERS = "https://covers.openlibrary.org/b";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OLAuthorRef {
  author: { key: string };
  type: { key: string };
}

export interface OLWork {
  key: string;               // e.g. "/works/OL123W"
  title: string;
  description?: string | { value: string };
  subjects?: string[];
  subject_people?: string[];
  subject_places?: string[];
  subject_times?: string[];
  covers?: number[];         // cover IDs
  authors?: OLAuthorRef[];
  first_publish_date?: string;
  // Internet Archive identifiers — present when readable
  ia?: string[];
  ia_box_id?: string[];
}

export interface OLEdition {
  key: string;               // e.g. "/books/OL123M"
  title: string;
  authors?: Array<{ key: string }>;
  covers?: number[];
  publish_date?: string;
  publishers?: string[];
  number_of_pages?: number;
  languages?: Array<{ key: string }>;
  isbn_13?: string[];
  isbn_10?: string[];
  ocaid?: string;            // Internet Archive identifier — key for reading
  ia_box_id?: string[];
  preview?: string;          // "full" | "restricted"
  preview_url?: string;
  read_url?: string;
}

export interface OLSearchDoc {
  key: string;               // "/works/OL123W"
  title: string;
  author_name?: string[];
  author_key?: string[];
  cover_i?: number;          // cover ID
  first_publish_year?: number;
  edition_count?: number;
  subject?: string[];
  ia?: string[];
  has_fulltext?: boolean;
  public_scan_b?: boolean;
}

export interface OLSearchResponse {
  numFound: number;
  start: number;
  docs: OLSearchDoc[];
}

export interface OLAuthor {
  key: string;
  name: string;
  birth_date?: string;
  death_date?: string;
  bio?: string | { value: string };
}

export interface OLEditionsResponse {
  entries: OLEdition[];
  size?: number;
}

// ─── Cover Image Helper ───────────────────────────────────────────────────────

export type CoverSize = "S" | "M" | "L";

export function getCoverUrl(
  coverId: number | undefined,
  size: CoverSize = "M"
): string {
  if (!coverId) return "";
  return `${OL_COVERS}/id/${coverId}-${size}.jpg`;
}

export function getCoverUrlByOlid(
  olid: string | undefined,
  size: CoverSize = "M"
): string {
  if (!olid) return "";
  return `${OL_COVERS}/olid/${olid}-${size}.jpg`;
}

// Extract work ID from full key ("/works/OL123W" → "OL123W")
export function extractWorkId(key: string): string {
  return key.replace("/works/", "");
}

// Extract edition ID from full key ("/books/OL123M" → "OL123M")
export function extractEditionId(key: string): string {
  return key.replace("/books/", "");
}

// ─── Fetch Helper ─────────────────────────────────────────────────────────────

async function olFetch<T>(url: string, timeout = 10000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 300 } });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`OpenLibrary HTTP ${res.status}`);
    return res.json() as Promise<T>;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") throw new Error("OpenLibrary request timed out.");
    throw err;
  }
}

// ─── Search ──────────────────────────────────────────────────────────────────

export type OLSearchType = "q" | "author" | "title" | "subject";

export async function searchOpenLibrary(
  query: string,
  page = 1,
  searchType: OLSearchType = "q",
  limit = 12
): Promise<OLSearchResponse> {
  if (!query.trim()) return { numFound: 0, start: 0, docs: [] };

  const params = new URLSearchParams({
    [searchType]: query.trim(),
    page: String(page),
    limit: String(limit),
    fields: "key,title,author_name,author_key,cover_i,first_publish_year,edition_count,subject,ia,has_fulltext,public_scan_b",
  });

  return olFetch<OLSearchResponse>(`${OL_BASE}/search.json?${params}`);
}

// ─── Work Details ─────────────────────────────────────────────────────────────

export async function getWorkDetails(workId: string): Promise<OLWork> {
  // Accept both "OL123W" and "/works/OL123W"
  const key = workId.startsWith("/works/") ? workId : `/works/${workId}`;
  return olFetch<OLWork>(`${OL_BASE}${key}.json`);
}

// ─── Work Editions ────────────────────────────────────────────────────────────

export async function getWorkEditions(
  workId: string,
  limit = 10
): Promise<OLEditionsResponse> {
  const key = workId.startsWith("/works/") ? workId : `/works/${workId}`;
  return olFetch<OLEditionsResponse>(
    `${OL_BASE}${key}/editions.json?limit=${limit}`
  );
}

// ─── Edition Details ──────────────────────────────────────────────────────────

export async function getEditionDetails(editionId: string): Promise<OLEdition> {
  const key = editionId.startsWith("/books/") ? editionId : `/books/${editionId}`;
  return olFetch<OLEdition>(`${OL_BASE}${key}.json`);
}

// ─── Author Details ───────────────────────────────────────────────────────────

export async function getAuthorDetails(authorKey: string): Promise<OLAuthor> {
  const key = authorKey.startsWith("/authors/") ? authorKey : `/authors/${authorKey}`;
  return olFetch<OLAuthor>(`${OL_BASE}${key}.json`);
}

// ─── Reading Availability (from search doc) ───────────────────────────────────

export type ReadingAvailability = "readable" | "preview" | "borrow_required" | "unavailable";

export function getAvailabilityFromDoc(doc: OLSearchDoc): ReadingAvailability {
  if (doc.public_scan_b === true) return "readable";
  if (doc.has_fulltext === true && doc.ia && doc.ia.length > 0) return "preview";
  return "unavailable";
}

// ─── Description Helper ───────────────────────────────────────────────────────

export function extractDescription(
  description?: string | { value: string }
): string {
  if (!description) return "";
  if (typeof description === "string") return description;
  return description.value || "";
}
