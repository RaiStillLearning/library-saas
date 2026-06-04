"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck, RefreshCw, Search, Filter,
  Loader2, BookPlus, Trash2, BookOpen,
  RotateCcw, FileText, ChevronDown,
} from "lucide-react";

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  entity?: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────
const MOCK_LOGS: AuditLog[] = [
  { id: "log-1", action: "Created Book", entity: "readspace_books", entity_id: "rs-001", metadata: { title: "Atomic Habits" }, created_at: new Date(Date.now() - 3_600_000).toISOString() },
  { id: "log-2", action: "Processed Borrowing", entity: "readspace_borrowings", entity_id: "bor-001", metadata: { book: "Atomic Habits" }, created_at: new Date(Date.now() - 7_200_000).toISOString() },
  { id: "log-3", action: "Processed Return", entity: "readspace_borrowings", entity_id: "bor-001", metadata: { book: "Atomic Habits" }, created_at: new Date(Date.now() - 86_400_000).toISOString() },
  { id: "log-4", action: "Updated Book", entity: "readspace_books", entity_id: "rs-002", metadata: { title: "Deep Work" }, created_at: new Date(Date.now() - 172_800_000).toISOString() },
  { id: "log-5", action: "Deleted Book", entity: "readspace_books", entity_id: "rs-003", metadata: { title: "Old Book" }, created_at: new Date(Date.now() - 259_200_000).toISOString() },
];

const ALL_ACTIONS = ["All", "Created Book", "Updated Book", "Deleted Book", "Processed Borrowing", "Processed Return"];

// ─── Action icon + color ──────────────────────────────────────────────────────
function ActionChip({ action }: { action: string }) {
  const config: Record<string, { icon: React.ElementType; color: string }> = {
    "Created Book": { icon: BookPlus, color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
    "Updated Book": { icon: BookOpen, color: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" },
    "Deleted Book": { icon: Trash2, color: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" },
    "Processed Borrowing": { icon: FileText, color: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
    "Processed Return": { icon: RotateCcw, color: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400" },
  };
  const c = config[action] || { icon: ShieldCheck, color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${c.color}`}>
      <Icon className="h-3 w-3" />
      {action}
    </span>
  );
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState("All");
  const [showFilter, setShowFilter] = useState(false);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // Try Supabase first
      const { createClient } = await import("@supabase/supabase-js");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) throw new Error("No Supabase config");

      const client = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await client
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs((data || []) as AuditLog[]);
    } catch {
      // Fallback to mock
      setLogs(MOCK_LOGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filtered = logs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.metadata || {}).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = selectedAction === "All" || log.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-blue-600 shrink-0" />
            Audit Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Full history of admin actions across the ReadSpace platform
          </p>
        </div>
        <button
          onClick={loadLogs}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search logs…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:border-blue-500 placeholder:text-slate-400"
          />
        </div>

        {/* Action filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-300 transition-colors cursor-pointer"
          >
            <Filter className="h-4 w-4" />
            {selectedAction}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </button>
          {showFilter && (
            <div className="absolute top-full left-0 mt-2 z-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden w-52">
              {ALL_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => { setSelectedAction(action); setShowFilter(false); }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                    selectedAction === action
                      ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          )}
          {showFilter && <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />}
        </div>
      </div>

      {/* Logs table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <ShieldCheck className="h-10 w-10 text-slate-200 dark:text-slate-700" />
            <p className="text-sm text-slate-400">No audit logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  {["Action", "Entity", "Details", "Time"].map((h) => (
                    <th key={h} className="px-5 py-3.5 font-bold uppercase tracking-wider text-slate-400 text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-5 py-3.5">
                      <ActionChip action={log.action} />
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-500 dark:text-slate-400">
                      {log.entity ? log.entity.replace("readspace_", "") : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 max-w-xs">
                      {log.metadata ? (
                        <span className="line-clamp-1">
                          {Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(", ")}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                      <span title={new Date(log.created_at).toLocaleString()}>
                        {relativeTime(log.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center">
        Showing {filtered.length} of {logs.length} log entries
      </p>
    </div>
  );
}
