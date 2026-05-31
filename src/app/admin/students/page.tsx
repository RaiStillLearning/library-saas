"use client";

import React, { useState } from "react";
import { Users, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const INITIAL_STUDENTS = [
  { id: "std-1", name: "Aditya Pratama", email: "aditya.pratama@readspace.edu", joinDate: "15 Jan 2026", status: "Active" },
  { id: "std-2", name: "Rina Wijaya", email: "rina.wijaya@readspace.edu", joinDate: "20 Jan 2026", status: "Active" },
  { id: "std-3", name: "Budi Santoso", email: "budi.santoso@readspace.edu", joinDate: "12 Feb 2026", status: "Restricted" },
  { id: "std-4", name: "Siti Rahma", email: "siti.rahma@readspace.edu", joinDate: "05 Mar 2026", status: "Active" },
];

export default function AdminStudentsPage() {
  const [students] = useState(INITIAL_STUDENTS);

  const handleRegisterStudent = () => {
    toast.info("Student registration is disabled in demo mode.");
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-600 shrink-0" />
            <span>Students Management</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Register students, manage status, and review credentials
          </p>
        </div>
        <button
          onClick={handleRegisterStudent}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Register Student</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4 font-semibold">Student Name</th>
              <th className="p-4 font-semibold">Email</th>
              <th className="p-4 font-semibold">Join Date</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
            {students.map((student) => (
              <tr key={student.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{student.name}</td>
                <td className="p-4 font-semibold text-slate-500 dark:text-slate-400">{student.email}</td>
                <td className="p-4 font-semibold text-slate-400">{student.joinDate}</td>
                <td className="p-4">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      student.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                    }`}
                  >
                    {student.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => toast.info("Editing student details is disabled.")}
                      className="p-1.5 border border-slate-150 hover:bg-slate-50 hover:text-blue-600 rounded-lg dark:border-slate-800 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toast.info("Removing student is disabled.")}
                      className="p-1.5 border border-slate-150 text-rose-500 hover:bg-rose-50 rounded-lg dark:border-slate-800 dark:hover:bg-rose-950/20 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
