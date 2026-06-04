"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Globe, BookOpen, AlertCircle, Loader2,
  ExternalLink, List, Maximize2, Minimize2,
} from "lucide-react";
import Link from "next/link";
import { resolveReader, ReaderResult } from "@/src/services/api/openlibrary-reader";
import { getWorkDetails, getCoverUrl, extractDescription } from "@/src/services/api/openlibrary";
import {
  upsertReadingHistory, upsertReadingListItem,
  logActivity,
} from "@/src/services/supabase/db";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import { toast } from "sonner";

export default function OpenLibraryReaderPage() {
  const { workId } = useParams<{ workId: string }>();
  const { user, profile } = useAuth();

  const [readerResult, setReaderResult] = useState<ReaderResult | null>(null);
  const [workTitle, setWorkTitle] = useState("Loading…");
  const [workCover, setWorkCover] = useState("");
  const [workAuthor, setWorkAuthor] = useState("");
  const [isResolving, setIsResolving] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const userId = user?.id || profile?.id || "";

  const load = useCallback(async () => {
    if (!workId) return;
    setIsResolving(true);
    setIframeLoaded(false);
    setIframeError(false);

    try {
      // Load work info and resolve reader in parallel
      const [workData, result] = await Promise.all([
        getWorkDetails(workId).catch(() => null),
        resolveReader(workId),
      ]);

      if (workData) {
        setWorkTitle(workData.title);
        const cover = workData.covers?.[0] ? getCoverUrl(workData.covers[0], "M") : "";
        setWorkCover(cover);
      }

      setReaderResult(result);

      // Save to reading history if readable/preview
      if (result.readable || result.preview) {
        if (userId && workData) {
          await upsertReadingHistory(userId, {
            work_id: workId,
            book_title: workData.title,
            book_cover: workData.covers?.[0] ? getCoverUrl(workData.covers[0], "M") : "",
            book_author: workAuthor,
            edition_id: result.editionId,
          });
          await logActivity(userId, {
            type: "started_reading",
            book_title: workData.title,
            book_cover: workData.covers?.[0] ? getCoverUrl(workData.covers[0], "M") : "",
            metadata: { work_id: workId },
          });
        }
      }
    } catch (err: any) {
      console.error("Reader load error:", err);
      setReaderResult({ readable: false, preview: false, externalUrl: `https://openlibrary.org/works/${workId}` });
    } finally {
      setIsResolving(false);
    }
  }, [workId, userId, workAuthor]);

  useEffect(() => { load(); }, [load]);

  const handleSaveToList = async () => {
    if (!userId) {
      toast.error("Please sign in to save to reading lists.");
      return;
    }
    try {
      await upsertReadingListItem(userId, {
        work_id: workId,
        book_title: workTitle,
        book_cover: workCover,
        book_author: workAuthor,
        list_type: "want_to_read",
      });
      toast.success("Saved to Want to Read!");
    } catch {
      toast.error("Failed to save.");
    }
  };

  // ── Unavailable state ──
  if (!isResolving && readerResult && !readerResult.readable && !readerResult.preview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 pb-16">
        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 max-w-md w-full text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl">
              <BookOpen className="h-10 w-10 text-slate-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Not Available for Online Reading
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              This book doesn&apos;t have a publicly accessible online reader.
              You can view it on OpenLibrary or save it to your reading list.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/openlibrary/${workId}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Book Details
            </Link>
            <a
              href={readerResult?.externalUrl || `https://openlibrary.org/works/${workId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Globe className="h-4 w-4" /> View on OpenLibrary
              <ExternalLink className="h-3.5 w-3.5 opacity-50" />
            </a>
            <button
              onClick={handleSaveToList}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <List className="h-4 w-4" /> Save to List
            </button>
          </div>
        </div>
      </div>
    );
  }

  const iframeUrl = readerResult?.readerUrl || readerResult?.externalUrl;

  return (
    <div className={`flex flex-col ${isFullscreen ? "fixed inset-0 z-50 bg-slate-950" : "h-[calc(100vh-8rem)]"}`}>
      {/* Reader Header */}
      <div className={`flex items-center justify-between gap-4 px-4 py-3 shrink-0 ${isFullscreen ? "bg-slate-900 border-b border-slate-800" : "bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 rounded-t-2xl"}`}>
        <Link
          href={`/openlibrary/${workId}`}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back</span>
        </Link>

        <div className="flex-1 min-w-0 text-center">
          {isResolving ? (
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading reader…
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {workTitle}
              </p>
              {readerResult?.preview && !readerResult?.readable && (
                <p className="text-[10px] text-blue-500 font-semibold">Preview Mode</p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {readerResult?.externalUrl && (
            <a
              href={readerResult.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors"
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Iframe Area */}
      <div className="flex-1 relative bg-slate-100 dark:bg-slate-950 rounded-b-2xl overflow-hidden">
        {/* Resolving overlay */}
        {isResolving && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-slate-50 dark:bg-slate-950">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <p className="text-sm text-slate-400 font-medium">Finding the best reader…</p>
          </div>
        )}

        {/* Iframe loading overlay */}
        {!isResolving && iframeUrl && !iframeLoaded && !iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-slate-50 dark:bg-slate-950">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            <p className="text-sm text-slate-400 font-medium">Opening reader…</p>
          </div>
        )}

        {/* Iframe error */}
        {iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-slate-50 dark:bg-slate-950">
            <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-2xl">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-700 dark:text-slate-300">Reader couldn&apos;t load</p>
              <p className="text-sm text-slate-400 mt-1">The embedded reader failed. Open in a new tab instead.</p>
            </div>
            {readerResult?.externalUrl && (
              <a
                href={readerResult.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4" /> Open in New Tab
              </a>
            )}
          </div>
        )}

        {/* The actual iframe */}
        {!isResolving && iframeUrl && (
          <iframe
            key={iframeUrl}
            src={iframeUrl}
            title={workTitle}
            className={`w-full h-full border-0 transition-opacity duration-300 ${iframeLoaded && !iframeError ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setIframeLoaded(true)}
            onError={() => setIframeError(true)}
            allow="fullscreen"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation"
          />
        )}
      </div>
    </div>
  );
}
