"use client";

import React, { useState } from "react";
import { ClipboardList, Plus, Edit2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const INITIAL_BORROWINGS = [
  { id: "b1", student: "Aditya Pratama", book: "Harry Potter dan Si Anak Terkutuk", date: "15 May 2026", dueDate: "29 May 2026", status: "Borrowed" },
  { id: "b2", student: "Rina Wijaya", book: "Atomic Habits", date: "10 May 2026", dueDate: "24 May 2026", status: "Returned" },
  { id: "b3", student: "Budi Santoso", book: "The Midnight Library", date: "01 May 2026", dueDate: "15 May 2026", status: "Overdue" },
];

export default function AdminBorrowingsPage() {
  const [borrowings, setBorrowings] = useState(INITIAL_BORROWINGS);

  const handleProcessBorrowing = () => {
    toast.info("Borrowing request process is disabled in demo mode.");
  };

  const handleMarkReturned = (id: string) => {
    setBorrowings(borrowings.map(b => b.id === id ? { ...b, status: "Returned" } : b));
    toast.success("Marked book as returned successfully");
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-blue-600 shrink-0" />
            <span>Borrowings Management</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Manage borrowing request transactions, return items, and track logs
          </p>
        </div>
        <button
          onClick={handleProcessBorrowing}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Borrowing</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4 font-semibold">Student Name</th>
              <th className="p-4 font-semibold">Book Title</th>
              <th className="p-4 font-semibold">Borrow Date</th>
              <th className="p-4 font-semibold">Due Date</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
            {borrowings.map((b) => (
              <tr key={b.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{b.student}</td>
                <td className="p-4 font-semibold text-slate-600 dark:text-slate-350">{b.book}</td>
                <td className="p-4 font-semibold text-slate-400">{b.date}</td>
                <td className="p-4 font-semibold text-slate-400">{b.dueDate}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      b.status === "Returned"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : b.status === "Overdue"
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                        : "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400"
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    {b.status !== "Returned" && (
                      <button
                        onClick={() => handleMarkReturned(b.id)}
                        className="p-1.5 border border-emerald-150 text-emerald-600 hover:bg-emerald-50 rounded-lg dark:border-slate-800 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Mark as Returned"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => toast.info("Editing borrowing info is disabled.")}
                      className="p-1.5 border border-slate-150 hover:bg-slate-50 hover:text-blue-600 rounded-lg dark:border-slate-800 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
