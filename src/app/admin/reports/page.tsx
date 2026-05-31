"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, RefreshCw, Sparkles, TrendingUp, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { toast } from "sonner";

const CHART_DATA = [
  { month: "Jan", borrowings: 240, returns: 180 },
  { month: "Feb", borrowings: 320, returns: 260 },
  { month: "Mar", borrowings: 280, returns: 310 },
  { month: "Apr", borrowings: 456, returns: 380 },
  { month: "May", borrowings: 390, returns: 410 },
];

export default function AdminReportsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleExport = () => {
    toast.success("Reports exported to CSV/PDF successfully.");
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-blue-600 shrink-0" />
            <span>Library Reports & Analytics</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Analyze borrowing trends, active student statistics, and library growth
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
        >
          <span>Export Report Data</span>
        </button>
      </div>

      {/* Analytics Main Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart 1: Borrow vs Return */}
        <div className="bg-white rounded-3xl border border-slate-100/80 p-6 md:p-8 dark:bg-slate-900 dark:border-slate-800 transition-colors space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">Transactions Breakdown</h3>
            <span className="text-[10px] font-bold text-slate-400">Jan - May 2026</span>
          </div>
          <div className="h-[260px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: "11px", fontWeight: "bold" }} stroke="#94A3B8" />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: "11px", fontWeight: "bold" }} stroke="#94A3B8" />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                  <Bar dataKey="borrowings" name="Borrowings" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="returns" name="Returns" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                <RefreshCw className="h-6 w-6 text-slate-300 animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Chart 2: Monthly Trends Line */}
        <div className="bg-white rounded-3xl border border-slate-100/80 p-6 md:p-8 dark:bg-slate-900 dark:border-slate-800 transition-colors space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50">Growth Trajectory</h3>
            <span className="text-[10px] font-bold text-slate-400">Monthly Average</span>
          </div>
          <div className="h-[260px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} style={{ fontSize: "11px", fontWeight: "bold" }} stroke="#94A3B8" />
                  <YAxis tickLine={false} axisLine={false} style={{ fontSize: "11px", fontWeight: "bold" }} stroke="#94A3B8" />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }} />
                  <Line type="monotone" dataKey="borrowings" name="Growth Index" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                <RefreshCw className="h-6 w-6 text-slate-300 animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
