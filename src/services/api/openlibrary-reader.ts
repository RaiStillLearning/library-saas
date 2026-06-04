// ─────────────────────────────────────────────────────────────────────────────
// OpenLibrary Reader Resolver
// Determines whether a work is actually readable before opening the reader.
// Never assume "edition exists = reader exists".
// ─────────────────────────────────────────────────────────────────────────────

import {
  getWorkDetails,
  getWorkEditions,
  getEditionDetails,
  extractWorkId,
} from "./openlibrary";

export interface ReaderResult {
  readable: boolean;       // can be read fully online (archive.org full access)
  preview: boolean;        // limited preview available
  archiveIdentifier?: string; // archive.org item identifier (ocaid)
  editionId?: string;      // OpenLibrary edition key (e.g. "OL123M")
  externalUrl?: string;    // fallback URL if iframe not available
  readerUrl?: string;      // resolved iframe src URL
}

/**
 * Resolve reading availability for an OpenLibrary work.
 * Returns a ReaderResult describing what's available and how to access it.
 */
export async function resolveReader(workId: string): Promise<ReaderResult> {
  const cleanWorkId = extractWorkId(workId); // Normalize to "OL123W"

  try {
    // Step 1: Fetch work metadata — check for ia (Internet Archive) identifiers
    const work = await getWorkDetails(cleanWorkId);

    // Step 2: If work has ia identifiers, try those first
    if (work.ia && work.ia.length > 0) {
      const archiveId = work.ia[0];
      return {
        readable: true,
        preview: false,
        archiveIdentifier: archiveId,
        externalUrl: `https://archive.org/details/${archiveId}`,
        readerUrl: `https://archive.org/details/${archiveId}`,
      };
    }

    // Step 3: Scan editions for ocaid or preview_url
    const editionsResponse = await getWorkEditions(cleanWorkId, 20);
    const editions = editionsResponse.entries || [];

    // Find fully readable edition (has ocaid)
    const readableEdition = editions.find(
      (ed) => ed.ocaid && ed.ocaid.trim() !== ""
    );

    if (readableEdition && readableEdition.ocaid) {
      return {
        readable: true,
        preview: false,
        archiveIdentifier: readableEdition.ocaid,
        editionId: readableEdition.key?.replace("/books/", ""),
        externalUrl: `https://archive.org/details/${readableEdition.ocaid}`,
        readerUrl: `https://archive.org/details/${readableEdition.ocaid}`,
      };
    }

    // Find preview-only edition
    const previewEdition = editions.find(
      (ed) => ed.preview === "full" || ed.preview_url || ed.read_url
    );

    if (previewEdition) {
      const previewUrl =
        previewEdition.read_url ||
        previewEdition.preview_url ||
        (previewEdition.ocaid
          ? `https://archive.org/details/${previewEdition.ocaid}`
          : undefined);

      return {
        readable: false,
        preview: true,
        editionId: previewEdition.key?.replace("/books/", ""),
        externalUrl: previewUrl || `https://openlibrary.org/works/${cleanWorkId}`,
        readerUrl: previewUrl,
      };
    }

    // Step 4: Try fetching individual edition details for first edition
    if (editions.length > 0) {
      try {
        const firstEdition = editions[0];
        const editionKey = firstEdition.key?.replace("/books/", "");
        if (editionKey) {
          const detail = await getEditionDetails(editionKey);
          if (detail.ocaid) {
            return {
              readable: true,
              preview: false,
              archiveIdentifier: detail.ocaid,
              editionId: editionKey,
              externalUrl: `https://archive.org/details/${detail.ocaid}`,
              readerUrl: `https://archive.org/details/${detail.ocaid}`,
            };
          }
        }
      } catch {
        // Edition fetch failed — continue to unavailable
      }
    }

    // Step 5: Unavailable
    return {
      readable: false,
      preview: false,
      externalUrl: `https://openlibrary.org/works/${cleanWorkId}`,
    };
  } catch (error) {
    console.error(`[ReaderResolver] Failed for workId=${cleanWorkId}:`, error);
    return {
      readable: false,
      preview: false,
      externalUrl: `https://openlibrary.org/works/${cleanWorkId}`,
    };
  }
}

/**
 * Quick check using search doc data — no extra API calls.
 * Use this for displaying availability badges in list/search views.
 */
export function quickAvailabilityCheck(doc: {
  has_fulltext?: boolean;
  public_scan_b?: boolean;
  ia?: string[];
}): "readable" | "preview" | "unavailable" {
  if (doc.public_scan_b === true) return "readable";
  if (doc.has_fulltext === true && doc.ia && doc.ia.length > 0) return "preview";
  return "unavailable";
}

/**
 * Build an archive.org reader URL from an identifier.
 */
export function buildArchiveReaderUrl(identifier: string): string {
  return `https://archive.org/details/${identifier}`;
}
