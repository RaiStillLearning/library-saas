"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Users,
  ClipboardList,
  Bookmark,
  TrendingUp,
  PlusCircle,
  UserPlus,
  RefreshCw,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";

// Mock chart data for borrowing activity
const CHART_DATA = [
  { month: "Jan", borrowings: 240 },
  { month: "Feb", borrowings: 320 },
  { month: "Mar", borrowings: 280 },
  { month: "Apr", borrowings: 456 },
  { month: "May", borrowings: 390 },
];

// Mock recent borrowings table data
const RECENT_BORROWINGS = [
  {
    id: "bor-1",
    student: { name: "Aditya Pratama", email: "aditya.pratama@readspace.edu" },
    book: "Harry Potter dan Si Anak Terkutuk",
    time: "2 hours ago",
    status: "Borrowed",
    color: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  },
  {
    id: "bor-2",
    student: { name: "Rina Wijaya", email: "rina.wijaya@readspace.edu" },
    book: "Atomic Habits",
    time: "4 hours ago",
    status: "Returned",
    color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  {
    id: "bor-3",
    student: { name: "Budi Santoso", email: "budi.santoso@readspace.edu" },
    book: "The Midnight Library",
    time: "Yesterday",
    status: "Overdue",
    color: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400",
  },
  {
    id: "bor-4",
    student: { name: "Siti Rahma", email: "siti.rahma@readspace.edu" },
    book: "Project Hail Mary",
    time: "Yesterday",
    status: "Borrowed",
    color: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  },
];

export default function AdminDashboardPage() {
  const [mounted, setMounted] = useState(false);

  // Recharts requires hydration check to render on client only in Next.js
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleQuickAction = (actionName: string) => {
    toast.success(`Action "${actionName}" processed successfully in administration dashboard.`);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col space-y-1.5">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Overview of your library management system
        </p>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Books */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <BookOpen className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              +12%
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Books</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">2,847</p>
          </div>
        </div>

        {/* Card 2: Active Students */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              +5.4%
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Students</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">1,234</p>
          </div>
        </div>

        {/* Card 3: Active Borrowings */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <ClipboardList className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 dark:text-rose-400 px-2 py-0.5 rounded-full">
              -2.1%
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Borrowings</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">456</p>
          </div>
        </div>

        {/* Card 4: Saved Books Catalog */}
        <div className="bg-white rounded-2xl border border-slate-100/80 p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-3 transition-colors">
          <div className="flex items-center justify-between">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
              <Bookmark className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
              +18.7%
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Saved Books</p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-50 mt-1">2,329</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Column */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100/80 p-6 md:p-8 dark:bg-slate-900 dark:border-slate-800 transition-colors space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Borrowing Activity</h3>
            <span className="text-xs font-bold text-slate-400">Jan - May 2026</span>
          </div>
          <div className="h-[300px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: "11px", fontWeight: "bold" }} stroke="#94A3B8" />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: "11px", fontWeight: "bold" }} stroke="#94A3B8" />
                  <Tooltip cursor={{ fill: "rgba(99, 102, 241, 0.05)" }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                  <Bar dataKey="borrowings" fill="#3B82F6" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                <RefreshCw className="h-6 w-6 text-slate-300 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white rounded-3xl border border-slate-100/80 p-6 md:p-8 dark:bg-slate-900 dark:border-slate-800 transition-colors space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleQuickAction("Add New Book")}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/20 text-slate-700 hover:text-blue-600 font-semibold text-xs transition-all dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-blue-400 cursor-pointer"
            >
              <PlusCircle className="h-5 w-5 text-blue-600 shrink-0" />
              <span>Add New Book</span>
            </button>
            <button
              onClick={() => handleQuickAction("Register Student")}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 hover:border-purple-100 hover:bg-purple-50/20 text-slate-700 hover:text-purple-600 font-semibold text-xs transition-all dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-purple-400 cursor-pointer"
            >
              <UserPlus className="h-5 w-5 text-purple-600 shrink-0" />
              <span>Register Student</span>
            </button>
            <button
              onClick={() => handleQuickAction("Process Borrowing")}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 hover:border-amber-100 hover:bg-amber-50/20 text-slate-700 hover:text-amber-600 font-semibold text-xs transition-all dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-amber-400 cursor-pointer"
            >
              <ClipboardList className="h-5 w-5 text-amber-600 shrink-0" />
              <span>Process Borrowing</span>
            </button>
            <button
              onClick={() => handleQuickAction("Generate Report")}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-100 hover:border-emerald-100 hover:bg-emerald-50/20 text-slate-700 hover:text-emerald-600 font-semibold text-xs transition-all dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-emerald-400 cursor-pointer"
            >
              <FileSpreadsheet className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Borrowings Table */}
      <div className="bg-white rounded-3xl border border-slate-100/80 p-6 md:p-8 dark:bg-slate-900 dark:border-slate-800 transition-colors space-y-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Recent Borrowings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 font-semibold">Student</th>
                <th className="pb-3 font-semibold">Book Title</th>
                <th className="pb-3 font-semibold">Time</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
              {RECENT_BORROWINGS.map((row) => (
                <tr key={row.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <td className="py-3">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{row.student.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{row.student.email}</p>
                    </div>
                  </td>
                  <td className="py-3 font-semibold text-slate-600 dark:text-slate-300">{row.book}</td>
                  <td className="py-3 font-semibold text-slate-400">{row.time}</td>
                  <td className="py-3 text-right">
                    <span
                      className={cn(
                        "px-2.5 py-0.5 rounded-full font-bold text-[10px]",
                        row.color
                      )}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
