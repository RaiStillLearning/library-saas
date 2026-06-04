"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ListChecks, BookOpen, Bookmark, CheckCircle2,
  Loader2, Trash2, ChevronDown, Globe,
} from "lucide-react";
import Link from "next/link";
import {
  fetchReadingList, upsertReadingListItem,
  removeFromReadingList, ReadingListEntry, ReadingListType,
} from "@/src/services/supabase/db";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import { toast } from "sonner";

const LISTS: { type: ReadingListType; label: string; icon: React.ElementType; color: string }[] = [
  { type: "want_to_read", label: "Want to Read", icon: Bookmark, color: "violet" },
  { type: "currently_reading", label: "Currently Reading", icon: BookOpen, color: "blue" },
  { type: "finished", label: "Finished", icon: CheckCircle2, color: "emerald" },
];

const LIST_MOVE_OPTIONS: { value: ReadingListType; label: string }[] = [
  { value: "want_to_read", label: "Want to Read" },
  { value: "currently_reading", label: "Currently Reading" },
  { value: "finished", label: "Finished" },
];

function BookCard({
  entry,
  onRemove,
  onMove,
}: {
  entry: ReadingListEntry;
  onRemove: (workId: string) => void;
  onMove: (workId: string, type: ReadingListType) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="group flex gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 hover:border-violet-200 dark:hover:border-violet-800/40 hover:shadow-md transition-all duration-200">
      {/* Cover */}
      <Link href={`/openlibrary/${entry.work_id}`} className="shrink-0">
        <div className="w-14 h-20 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 flex items-center justify-center">
          {entry.book_cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={entry.book_cover}
              alt={entry.book_title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <BookOpen className="h-6 w-6 text-violet-300" />
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/openlibrary/${entry.work_id}`} className="block group/title">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug line-clamp-2 group-hover/title:text-violet-600 dark:group-hover/title:text-violet-400 transition-colors">
            {entry.book_title}
          </h3>
        </Link>
        {entry.book_author && (
          <p className="text-xs text-slate-500 mt-0.5">{entry.book_author}</p>
        )}
        {entry.added_at && (
          <p className="text-[10px] text-slate-400 mt-1">
            Added {new Date(entry.added_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Move */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer"
            >
              Move <ChevronDown className="h-3 w-3" />
            </button>
            {showMenu && (
              <div className="absolute top-full left-0 mt-1 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden w-44">
                {LIST_MOVE_OPTIONS.filter((o) => o.value !== entry.list_type).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { onMove(entry.work_id, opt.value); setShowMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <span className="text-slate-200 dark:text-slate-700">|</span>

          <Link
            href={`/openlibrary/${entry.work_id}`}
            className="text-xs font-semibold text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-1"
          >
            <Globe className="h-3 w-3" /> Details
          </Link>

          <span className="text-slate-200 dark:text-slate-700">|</span>

          <button
            onClick={() => onRemove(entry.work_id)}
            className="text-xs font-semibold text-slate-400 hover:text-red-500 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="h-3 w-3" /> Remove
          </button>
        </div>
      </div>

      {showMenu && <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />}
    </div>
  );
}

export default function ReadingListsPage() {
  const { user, profile } = useAuth();
  const [allEntries, setAllEntries] = useState<ReadingListEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReadingListType>("want_to_read");

  const userId = user?.id || profile?.id || "";

  const loadList = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await fetchReadingList(userId);
      setAllEntries(data);
    } catch {
      toast.error("Failed to load reading lists.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadList(); }, [loadList]);

  const handleRemove = async (workId: string) => {
    try {
      await removeFromReadingList(userId, workId);
      setAllEntries((prev) => prev.filter((e) => e.work_id !== workId));
      toast.success("Removed from reading list.");
    } catch {
      toast.error("Failed to remove.");
    }
  };

  const handleMove = async (workId: string, newType: ReadingListType) => {
    const entry = allEntries.find((e) => e.work_id === workId);
    if (!entry) return;
    try {
      await upsertReadingListItem(userId, { ...entry, list_type: newType });
      setAllEntries((prev) =>
        prev.map((e) => e.work_id === workId ? { ...e, list_type: newType } : e)
      );
      const listLabel = LISTS.find((l) => l.type === newType)?.label;
      toast.success(`Moved to "${listLabel}"`);
    } catch {
      toast.error("Failed to move.");
    }
  };

  const grouped = LISTS.reduce((acc, list) => {
    acc[list.type] = allEntries.filter((e) => e.list_type === list.type);
    return acc;
  }, {} as Record<ReadingListType, ReadingListEntry[]>);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2 font-display">
            <ListChecks className="h-7 w-7 text-violet-600 shrink-0" />
            <span>Reading Lists</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Track your reading journey — books to read, reading now, and finished
          </p>
        </div>
        <div className="flex gap-3">
          {LISTS.map(({ type, label }) => (
            <div key={type} className="text-center">
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {grouped[type]?.length || 0}
              </p>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">
                {label.split(" ")[0]}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {LISTS.map(({ type, label, icon: Icon, color }) => {
          const count = grouped[type]?.length || 0;
          const isActive = activeTab === type;
          return (
            <button
              key={type}
              onClick={() => setActiveTab(type)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? `bg-${color}-600 text-white shadow-sm`
                  : `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-${color}-300`
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : grouped[activeTab]?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="p-5 bg-violet-50 dark:bg-violet-950/30 rounded-2xl">
            {React.createElement(LISTS.find((l) => l.type === activeTab)!.icon, {
              className: "h-10 w-10 text-violet-300"
            })}
          </div>
          <div className="text-center">
            <p className="font-bold text-slate-700 dark:text-slate-300">
              {LISTS.find((l) => l.type === activeTab)?.label} is empty
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Find books on{" "}
              <Link href="/openlibrary" className="text-violet-600 hover:underline font-medium">
                OpenLibrary
              </Link>{" "}
              and save them here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {grouped[activeTab].map((entry) => (
            <BookCard
              key={entry.work_id}
              entry={entry}
              onRemove={handleRemove}
              onMove={handleMove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
