"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  BookOpen, ArrowLeft, Globe, Loader2, AlertCircle, Tag,
  Calendar, BookMarked, ChevronDown, ChevronUp, List, CheckCircle,
  ExternalLink, BookOpenCheck,
} from "lucide-react";
import Link from "next/link";
import {
  getWorkDetails, getAuthorDetails,
  getCoverUrl, extractDescription,
  OLWork,
} from "@/src/services/api/openlibrary";
import { resolveReader, ReaderResult } from "@/src/services/api/openlibrary-reader";
import {
  upsertReadingListItem, fetchReadingList,
  ReadingListType, ReadingListEntry,
  upsertReadingHistory,
} from "@/src/services/supabase/db";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import { toast } from "sonner";

const AVAILABILITY_CONFIG = {
  readable: {
    label: "Available Online",
    className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
    dot: "bg-emerald-500",
  },
  preview: {
    label: "Preview Only",
    className: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200 dark:border-blue-900/40",
    dot: "bg-blue-500",
  },
  unavailable: {
    label: "Info Only",
    className: "bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
};

const LIST_OPTIONS: { value: ReadingListType; label: string }[] = [
  { value: "want_to_read", label: "Want to Read" },
  { value: "currently_reading", label: "Currently Reading" },
  { value: "finished", label: "Finished Reading" },
];

function WorkDetailSkeleton() {
  return (
    <div className="animate-pulse space-y-8 pb-16">
      <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-32" />
      <div className="flex flex-col md:flex-row gap-8">
        <div className="shrink-0 w-full md:w-48 h-72 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-3/4" />
          <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
          <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded w-24" />
          <div className="space-y-2 pt-4">
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-full" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-5/6" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-4/6" />
          </div>
          <div className="flex gap-3 pt-4">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-32" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-40" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkDetailPage() {
  const { workId } = useParams<{ workId: string }>();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [work, setWork] = useState<OLWork | null>(null);
  const [authorName, setAuthorName] = useState<string>("");
  const [readerResult, setReaderResult] = useState<ReaderResult | null>(null);
  const [myListEntry, setMyListEntry] = useState<ReadingListEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isResolving, setIsResolving] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  const [isSavingList, setIsSavingList] = useState(false);

  const userId = user?.id || profile?.id || "";

  const load = useCallback(async () => {
    if (!workId) return;
    setIsLoading(true);
    setError(null);
    try {
      const workData = await getWorkDetails(workId);
      setWork(workData);

      // Fetch author name
      if (workData.authors && workData.authors.length > 0) {
        try {
          const authorKey = workData.authors[0].author.key;
          const author = await getAuthorDetails(authorKey);
          setAuthorName(author.name || "Unknown Author");
        } catch {
          setAuthorName("Unknown Author");
        }
      }

      // Resolve reader in background
      setIsResolving(true);
      resolveReader(workId).then((result) => {
        setReaderResult(result);
        setIsResolving(false);
      });

      // Load user's reading list entry if logged in
      if (userId) {
        try {
          const list = await fetchReadingList(userId);
          const entry = list.find((e) => e.work_id === workId);
          setMyListEntry(entry || null);
        } catch {/* ignore */}
      }
    } catch (err: any) {
      setError(err.message || "Failed to load book details.");
    } finally {
      setIsLoading(false);
    }
  }, [workId, userId]);

  useEffect(() => { load(); }, [load]);

  const handleSaveToList = async (listType: ReadingListType) => {
    if (!userId) {
      toast.error("Please sign in to save books to your reading list.");
      return;
    }
    setIsSavingList(true);
    setShowListMenu(false);
    try {
      const coverUrl = work?.covers?.[0] ? getCoverUrl(work.covers[0], "M") : "";
      await upsertReadingListItem(userId, {
        work_id: workId,
        book_title: work?.title || "Unknown",
        book_cover: coverUrl,
        book_author: authorName,
        list_type: listType,
      });
      const updated: ReadingListEntry = {
        work_id: workId,
        book_title: work?.title || "Unknown",
        book_cover: coverUrl,
        book_author: authorName,
        list_type: listType,
      };
      setMyListEntry(updated);
      toast.success(`Added to "${LIST_OPTIONS.find((l) => l.value === listType)?.label}"!`);
    } catch {
      toast.error("Failed to save to reading list.");
    } finally {
      setIsSavingList(false);
    }
  };

  const handleReadNow = async () => {
    if (userId && work) {
      const coverUrl = work.covers?.[0] ? getCoverUrl(work.covers[0], "M") : "";
      await upsertReadingHistory(userId, {
        work_id: workId,
        book_title: work.title,
        book_cover: coverUrl,
        book_author: authorName,
        edition_id: readerResult?.editionId,
      });
    }
    router.push(`/openlibrary/read/${workId}`);
  };

  if (isLoading) return <WorkDetailSkeleton />;

  if (error || !work) {
    return (
      <div className="space-y-6 pb-16">
        <Link href="/openlibrary" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 transition-colors cursor-pointer">
          <ArrowLeft className="h-4 w-4" /> Back to OpenLibrary
        </Link>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="p-5 bg-red-50 dark:bg-red-950/30 rounded-2xl">
            <AlertCircle className="h-10 w-10 text-red-400" />
          </div>
          <p className="font-bold text-slate-700 dark:text-slate-300">Failed to load book</p>
          <p className="text-sm text-slate-400">{error}</p>
          <button onClick={load} className="px-5 py-2 bg-violet-600 text-white rounded-xl text-sm font-semibold cursor-pointer hover:bg-violet-700 transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const description = extractDescription(work.description);
  const coverUrl = work.covers?.[0] ? getCoverUrl(work.covers[0], "L") : "";
  const subjects = (work.subjects || []).slice(0, 12);

  const availabilityKey =
    readerResult?.readable ? "readable"
    : readerResult?.preview ? "preview"
    : "unavailable";

  const availConfig = AVAILABILITY_CONFIG[availabilityKey];
  const canRead = readerResult?.readable || readerResult?.preview;

  return (
    <div className="space-y-8 pb-16">
      {/* Back */}
      <Link
        href="/openlibrary"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer font-medium"
      >
        <ArrowLeft className="h-4 w-4" /> OpenLibrary
      </Link>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Cover */}
        <div className="shrink-0 flex flex-col items-center md:items-start gap-3">
          <div className="w-40 md:w-48 h-60 md:h-72 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-2xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 flex items-center justify-center">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverUrl} alt={work.title} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-3 p-4 text-center">
                <BookOpen className="h-12 w-12 text-violet-300" />
                <span className="text-xs text-violet-400 font-medium">{work.title}</span>
              </div>
            )}
          </div>

          {/* Availability badge */}
          {isResolving ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Checking availability...
            </div>
          ) : (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${availConfig.className}`}>
              <span className={`w-2 h-2 rounded-full ${availConfig.dot}`} />
              {availConfig.label}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0 space-y-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-slate-50 leading-tight">
              {work.title}
            </h1>
            {authorName && (
              <p className="text-base text-violet-600 dark:text-violet-400 font-semibold mt-1">
                {authorName}
              </p>
            )}
            {work.first_publish_date && (
              <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" /> {work.first_publish_date}
              </p>
            )}
          </div>

          {/* Description */}
          {description && (
            <div>
              <p className={`text-sm text-slate-600 dark:text-slate-400 leading-relaxed ${descExpanded ? "" : "line-clamp-4"}`}>
                {description}
              </p>
              {description.length > 300 && (
                <button
                  onClick={() => setDescExpanded(!descExpanded)}
                  className="flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 mt-2 cursor-pointer hover:underline"
                >
                  {descExpanded ? <><ChevronUp className="h-3.5 w-3.5" /> Show less</> : <><ChevronDown className="h-3.5 w-3.5" /> Read more</>}
                </button>
              )}
            </div>
          )}

          {/* Subjects */}
          {subjects.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Subjects
              </p>
              <div className="flex flex-wrap gap-2">
                {subjects.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-400">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {/* Read Now */}
            {!isResolving && canRead && (
              <button
                onClick={handleReadNow}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-95 cursor-pointer"
              >
                <BookOpenCheck className="h-4 w-4" />
                {readerResult?.readable ? "Read Now" : "Preview"}
              </button>
            )}

            {/* Save to Reading List */}
            <div className="relative">
              <button
                onClick={() => setShowListMenu(!showListMenu)}
                disabled={isSavingList}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${
                  myListEntry
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40"
                    : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-violet-400 hover:text-violet-600"
                } disabled:opacity-60`}
              >
                {isSavingList ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : myListEntry ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <List className="h-4 w-4" />
                )}
                {myListEntry
                  ? LIST_OPTIONS.find((l) => l.value === myListEntry.list_type)?.label
                  : "Save to List"}
                <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>

              {showListMenu && (
                <div className="absolute top-full left-0 mt-2 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden w-52">
                  {LIST_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSaveToList(opt.value)}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer flex items-center gap-2 ${
                        myListEntry?.list_type === opt.value
                          ? "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      {myListEntry?.list_type === opt.value && <CheckCircle className="h-3.5 w-3.5 text-violet-500 shrink-0" />}
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Open on OpenLibrary */}
            <a
              href={`https://openlibrary.org/works/${workId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200 dark:hover:border-slate-600 transition-all"
            >
              <Globe className="h-4 w-4" />
              OpenLibrary
              <ExternalLink className="h-3.5 w-3.5 opacity-50" />
            </a>
          </div>

          {/* Unavailable message */}
          {!isResolving && !canRead && (
            <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
              <AlertCircle className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  Not available for online reading
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  This book doesn&apos;t have a publicly readable version. You can view it on OpenLibrary or save it to your reading list.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Close list menu on outside click */}
      {showListMenu && (
        <div className="fixed inset-0 z-10" onClick={() => setShowListMenu(false)} />
      )}
    </div>
  );
}
