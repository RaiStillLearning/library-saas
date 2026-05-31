"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import {
  User,
  Mail,
  Calendar,
  BookOpen,
  Award,
  Clock,
  Settings,
  Heart,
  ChevronRight,
  TrendingUp,
  Bookmark,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";

// Mock Achievements list
const ACHIEVEMENTS = [
  {
    id: "ach-1",
    name: "Classic Scholar",
    description: "Read 5 literature classics",
    unlocked: true,
    color: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
  },
  {
    id: "ach-2",
    name: "Bookworm Elite",
    description: "Borrowed 20+ books from catalog",
    unlocked: true,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400",
  },
  {
    id: "ach-3",
    name: "Night Owl",
    description: "Added 10 books in late evening hours",
    unlocked: false,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400",
  },
];

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const [borrowedCount, setBorrowedCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Load profile stats and activities from localStorage
  useEffect(() => {
    const borrowed = JSON.parse(localStorage.getItem("readspace_borrowed_books") || "[]");
    const saved = JSON.parse(localStorage.getItem("readspace_saved_books") || "[]");
    
    setBorrowedCount(borrowed.length);
    setSavedCount(saved.length);

    // Generate active feed from borrowed and saved lists
    const activities: any[] = [];
    
    borrowed.forEach((book: any) => {
      activities.push({
        type: "borrow",
        title: `Borrowed "${book.title}"`,
        time: new Date(book.borrowDate || Date.now()).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        icon: <BookOpen className="h-4 w-4 text-blue-600" />,
      });
    });

    saved.forEach((id: string) => {
      activities.push({
        type: "save",
        title: `Saved a book to Library`,
        time: "Recently",
        icon: <Bookmark className="h-4 w-4 text-rose-500" />,
      });
    });

    // Sort or slice
    setRecentActivities(activities.slice(0, 5));
  }, []);

  const handleEditProfile = () => {
    toast.info("Profile editing is disabled in demo mode.");
  };

  const displayName = profile?.name || user?.email?.split("@")[0] || "John Doe";
  const displayEmail = user?.email || "john.doe@example.com";
  const memberSince = "January 2026"; // mock join date

  return (
    <div className="space-y-8 pb-16 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Manage your personal details, stats, and achievements
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm p-6 md:p-8 dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-center justify-between transition-all duration-300">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Avatar Container */}
          <div className="h-24 w-24 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-200 dark:shadow-none">
            {displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)}
          </div>

          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              {displayName}
            </h2>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center justify-center md:justify-start text-xs text-slate-500 dark:text-slate-400 font-semibold">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {displayEmail}
              </span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Member since {memberSince}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleEditProfile}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 rounded-xl text-sm font-semibold transition-all cursor-pointer"
        >
          Edit Profile
        </button>
      </div>

      {/* Grid: Statistics cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stat 1 */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-2">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl w-fit">
            <BookOpen className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Books Borrowed
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-50">
            {borrowedCount}
          </p>
        </div>

        {/* Stat 2 */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-2">
          <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl w-fit">
            <Heart className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Saved Books
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-50">
            {savedCount}
          </p>
        </div>

        {/* Stat 3 */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-2">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl w-fit">
            <Award className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Achievements
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-50">
            {ACHIEVEMENTS.filter(a => a.unlocked).length} / {ACHIEVEMENTS.length}
          </p>
        </div>

        {/* Stat 4 */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-2">
          <div className="p-2 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl w-fit">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Reading Level
          </p>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-50">
            {borrowedCount >= 5 ? "Elite Bibliophile" : "Avid Learner"}
          </p>
        </div>
      </div>

      {/* Bottom Grid: Activity Feed & Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white rounded-3xl border border-slate-100/80 p-6 md:p-8 dark:bg-slate-900 dark:border-slate-800 space-y-6 transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            Recent Library Activity
          </h3>
          {recentActivities.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm font-medium">
              No recent activity. Borrow or save books to populate your log.
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl shrink-0">
                    {act.icon}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {act.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      {act.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Achievements list */}
        <div className="bg-white rounded-3xl border border-slate-100/80 p-6 md:p-8 dark:bg-slate-900 dark:border-slate-800 space-y-6 transition-colors">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            Achievements & Badges
          </h3>
          <div className="space-y-4">
            {ACHIEVEMENTS.map((ach) => (
              <div
                key={ach.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                  ach.unlocked
                    ? "bg-slate-50/50 border-slate-100 dark:bg-slate-800/20 dark:border-slate-800/50"
                    : "bg-slate-50/20 border-slate-100/30 opacity-55 dark:bg-slate-900/10 dark:border-slate-800/10"
                )}
              >
                <div className="flex gap-3.5 items-center">
                  <div className={cn("p-2.5 rounded-xl shrink-0 font-bold text-sm", ach.color)}>
                    <Award className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {ach.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {ach.description}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    ach.unlocked
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                  )}
                >
                  {ach.unlocked ? "Unlocked" : "Locked"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
