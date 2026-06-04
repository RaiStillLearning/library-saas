"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BookOpen, Users, ClipboardList, AlertTriangle,
  TrendingUp, RefreshCw, CheckCircle, XCircle,
  Loader2, Activity, BookMarked, ArrowRight,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import {
  fetchReadSpaceBooks,
  fetchAllReadSpaceBorrowingsAdmin,
  ReadSpaceBorrowing,
} from "@/src/services/supabase/db";

// ─── System Status Check ──────────────────────────────────────────────────────
type ServiceStatus = "checking" | "operational" | "unavailable";

async function pingService(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal, mode: "no-cors" });
    clearTimeout(timer);
    return true; // no-cors always resolves (opaque response) — means reachable
  } catch {
    return false;
  }
}

// ─── Analytics helpers ────────────────────────────────────────────────────────
function groupBorrowingsByMonth(borrowings: ReadSpaceBorrowing[]) {
  const counts: Record<string, number> = {};
  borrowings.forEach((b) => {
    const d = new Date(b.borrow_date || b.created_at || Date.now());
    const key = d.toLocaleString("default", { month: "short" });
    counts[key] = (counts[key] || 0) + 1;
  });
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months
    .filter((m) => counts[m])
    .map((m) => ({ month: m, borrowings: counts[m] }));
}

function topBorrowedBooks(borrowings: ReadSpaceBorrowing[], limit = 5) {
  const counts: Record<string, { title: string; count: number }> = {};
  borrowings.forEach((b) => {
    const key = b.book_id || "unknown";
    const title = b.book?.title || key;
    if (!counts[key]) counts[key] = { title, count: 0 };
    counts[key].count++;
  });
  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);

  // Data
  const [totalBooks, setTotalBooks] = useState(0);
  const [borrowings, setBorrowings] = useState<ReadSpaceBorrowing[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // System status
  const [olStatus, setOlStatus] = useState<ServiceStatus>("checking");
  const [buStatus, setBuStatus] = useState<ServiceStatus>("checking");
  const [dbStatus, setDbStatus] = useState<ServiceStatus>("checking");

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [books, borrows] = await Promise.all([
        fetchReadSpaceBooks(),
        fetchAllReadSpaceBorrowingsAdmin(),
      ]);
      setTotalBooks(books.length);
      setBorrowings(borrows);
      setDbStatus("operational");
    } catch {
      setDbStatus("unavailable");
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  const checkStatuses = useCallback(async () => {
    setOlStatus("checking");
    setBuStatus("checking");

    pingService("https://openlibrary.org/search.json?q=test&limit=1").then((ok) =>
      setOlStatus(ok ? "operational" : "unavailable")
    );
    pingService("https://api.bukuacak.shabsolute.tech/api/v1/book?page=1&limit=1").then((ok) =>
      setBuStatus(ok ? "operational" : "unavailable")
    );
  }, []);

  useEffect(() => {
    setMounted(true);
    loadData();
    checkStatuses();
  }, [loadData, checkStatuses]);

  // Derived metrics
  const activeBorrowings = borrowings.filter((b) => b.status === "borrowed");
  const overdueBorrowings = borrowings.filter((b) => {
    if (b.status !== "borrowed") return false;
    const due = new Date(b.due_date);
    return due < new Date();
  });
  const recentBorrowings = [...borrowings]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5);

  const chartData = groupBorrowingsByMonth(borrowings);
  const topBooks = topBorrowedBooks(borrowings);

  const StatusIcon = ({ status }: { status: ServiceStatus }) => {
    if (status === "checking") return <Loader2 className="h-4 w-4 animate-spin text-slate-400" />;
    if (status === "operational") return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const statusDot = (s: ServiceStatus) =>
    s === "operational" ? "bg-emerald-500" : s === "unavailable" ? "bg-red-500" : "bg-slate-400";

  const statusLabel = (s: ServiceStatus) =>
    s === "operational" ? "Operational" : s === "unavailable" ? "Unavailable" : "Checking…";

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Real-time overview of your ReadSpace library
          </p>
        </div>
        <button
          onClick={() => { loadData(); checkStatuses(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isLoadingData ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: "ReadSpace Books",
            value: isLoadingData ? "—" : totalBooks,
            icon: BookOpen,
            color: "blue",
            sub: "in library catalog",
          },
          {
            label: "Active Borrowings",
            value: isLoadingData ? "—" : activeBorrowings.length,
            icon: ClipboardList,
            color: "amber",
            sub: "currently borrowed",
          },
          {
            label: "Overdue",
            value: isLoadingData ? "—" : overdueBorrowings.length,
            icon: AlertTriangle,
            color: "rose",
            sub: "past due date",
          },
          {
            label: "Total Transactions",
            value: isLoadingData ? "—" : borrowings.length,
            icon: TrendingUp,
            color: "emerald",
            sub: "all time",
          },
        ].map((card) => (
          <div key={card.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className={`p-2.5 bg-${card.color}-50 dark:bg-${card.color}-950/40 text-${card.color}-600 dark:text-${card.color}-400 rounded-xl`}>
                <card.icon className="h-5 w-5" />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">
                {isLoadingData ? <span className="opacity-30">—</span> : card.value}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Chart + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Borrowings chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              Borrowing Activity
            </h3>
          </div>
          <div className="h-[240px]">
            {mounted && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: "11px", fontWeight: "bold" }} stroke="#94A3B8" />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: "11px", fontWeight: "bold" }} stroke="#94A3B8" />
                  <Tooltip cursor={{ fill: "rgba(99,102,241,0.05)" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="borrowings" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : mounted && chartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
                <BookMarked className="h-8 w-8 opacity-30" />
                <p className="text-xs">No borrowing data yet</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">System Status</h3>
            <button onClick={checkStatuses} className="text-xs text-slate-400 hover:text-blue-500 cursor-pointer transition-colors">
              Re-check
            </button>
          </div>
          <div className="space-y-3">
            {[
              { name: "OpenLibrary API", status: olStatus },
              { name: "Gramedia (BukuAcak)", status: buStatus },
              { name: "Supabase / Database", status: dbStatus },
            ].map(({ name, status }) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${statusDot(status)} ${status === "checking" ? "animate-pulse" : ""}`} />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusIcon status={status} />
                  <span className={`text-[10px] font-bold ${
                    status === "operational" ? "text-emerald-600" :
                    status === "unavailable" ? "text-red-500" : "text-slate-400"
                  }`}>
                    {statusLabel(status)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Quick Links</p>
            {[
              { label: "Manage Books", href: "/admin/readspace-books" },
              { label: "Borrowings", href: "/admin/borrowings" },
              { label: "Audit Logs", href: "/admin/audit-logs" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                {l.label} <ArrowRight className="h-3 w-3" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Most Borrowed + Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top borrowed books */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            Most Borrowed
          </h3>
          {isLoadingData ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : topBooks.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No borrowings recorded yet</p>
          ) : (
            <div className="space-y-2">
              {topBooks.map((book, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[10px] font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">{book.title}</p>
                  <span className="text-xs font-bold text-slate-400">{book.count}×</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent borrowing events */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
              <Activity className="h-4 w-4 text-violet-500" />
              Recent Events
            </h3>
            <Link href="/admin/borrowings" className="text-xs font-semibold text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {isLoadingData ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentBorrowings.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No borrowing events yet</p>
          ) : (
            <div className="space-y-2">
              {recentBorrowings.map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${
                    b.status === "borrowed" ? "bg-blue-500" :
                    b.status === "returned" ? "bg-emerald-500" : "bg-rose-500"
                  }`} />
                  <p className="flex-1 text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-1">
                    {b.book?.title || b.book_id}
                  </p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    b.status === "borrowed" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400" :
                    b.status === "returned" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400" :
                    "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                  }`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
