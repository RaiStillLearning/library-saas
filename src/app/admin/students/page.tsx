"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  UserMinus,
  Search,
  Loader2,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchAllProfilesAdmin,
  updateProfileAdmin,
  deleteProfileAdmin,
  Profile,
} from "@/src/services/supabase/db";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit Modal State
  const [editingStudent, setEditingStudent] = useState<Profile | null>(null);
  const [modalStatus, setModalStatus] = useState<"active" | "suspended" | "graduated">("active");
  const [modalApproval, setModalApproval] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllProfilesAdmin();
      // Filter out admin users if any, showing only students
      setStudents(data.filter((s) => s.role === "student"));
    } catch (err) {
      console.error("Error loading students:", err);
      toast.error("Failed to load students.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleOpenEdit = (student: Profile) => {
    setEditingStudent(student);
    setModalStatus(student.status || "active");
    setModalApproval(student.approval_required !== false);
  };

  const handleCloseEdit = () => {
    setEditingStudent(null);
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent) return;
    setIsUpdating(true);
    try {
      const success = await updateProfileAdmin(editingStudent.id, {
        status: modalStatus,
        approval_required: modalApproval,
      });

      if (success) {
        toast.success(`Updated ${editingStudent.name}'s account.`);
        await loadStudents();
        handleCloseEdit();
      } else {
        toast.error("Failed to update student profile.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred during update.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteStudent = async (student: Profile) => {
    if (!confirm(`Are you sure you want to delete student ${student.name}?`)) return;
    setDeletingId(student.id);
    try {
      const res = await deleteProfileAdmin(student.id);
      if (res.success) {
        toast.success(res.message);
        await loadStudents();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while deleting.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    return (
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Calculate stats
  const totalCount = students.length;
  const activeCount = students.filter((s) => s.status === "active" || !s.status).length;
  const suspendedCount = students.filter((s) => s.status === "suspended").length;
  const graduatedCount = students.filter((s) => s.status === "graduated").length;

  return (
    <div className="space-y-8 pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Users className="h-7 w-7 text-indigo-600 shrink-0" />
            <span>Students Management</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Manage account status, toggles for borrowing approval requirements, and delete profiles.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Students", value: totalCount, icon: Users, color: "indigo" },
          { label: "Active Accounts", value: activeCount, icon: CheckCircle, color: "emerald" },
          { label: "Suspended", value: suspendedCount, icon: AlertTriangle, color: "rose" },
          { label: "Graduated", value: graduatedCount, icon: UserCheck, color: "amber" },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {card.label}
              </span>
              <div
                className={`p-2 rounded-lg bg-${card.color}-50 dark:bg-${card.color}-950/20 text-${card.color}-600 dark:text-${card.color}-400`}
              >
                <card.icon className="h-4 w-4" />
              </div>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-50">
              {isLoading ? <span className="opacity-30">—</span> : card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 shadow-sm max-w-md">
        <Search className="h-5 w-5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by student name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-sm bg-transparent outline-none border-none text-slate-800 dark:text-slate-200 placeholder-slate-400"
        />
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-semibold">Loading students profiles...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
            <UserMinus className="h-10 w-10 opacity-30" />
            <p className="text-sm font-semibold">No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="p-5 font-semibold">Student Name</th>
                  <th className="p-5 font-semibold">Email Address</th>
                  <th className="p-5 font-semibold">Approval Required</th>
                  <th className="p-5 font-semibold">Status</th>
                  <th className="p-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="group hover:bg-slate-50/30 dark:hover:bg-slate-850/10 transition-colors"
                  >
                    <td className="p-5 font-bold text-slate-800 dark:text-slate-200">
                      {student.name}
                    </td>
                    <td className="p-5 font-semibold text-slate-500 dark:text-slate-400">
                      {student.email}
                    </td>
                    <td className="p-5">
                      {student.approval_required !== false ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400">
                          <Shield className="h-3 w-3" />
                          <span>Yes</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                          <UserCheck className="h-3 w-3" />
                          <span>Bypassed</span>
                        </span>
                      )}
                    </td>
                    <td className="p-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          student.status === "suspended"
                            ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                            : student.status === "graduated"
                            ? "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                            : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            student.status === "suspended"
                              ? "bg-rose-500"
                              : student.status === "graduated"
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                          }`}
                        />
                        <span className="capitalize">{student.status || "active"}</span>
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(student)}
                          className="p-1.5 border border-slate-100 hover:border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all cursor-pointer"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student)}
                          disabled={deletingId === student.id}
                          className="p-1.5 border border-slate-100 hover:border-rose-200 text-rose-500 hover:bg-rose-50 dark:border-slate-800 dark:hover:bg-rose-950/20 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {deletingId === student.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-6 shadow-xl max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-1 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-indigo-600" />
              <span>Edit Student Options</span>
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-medium">
              Updating {editingStudent.name} ({editingStudent.email})
            </p>

            <div className="space-y-5">
              {/* Account Status Field */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Account Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["active", "suspended", "graduated"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setModalStatus(s)}
                      className={`py-2 px-3 text-xs font-bold capitalize rounded-xl border transition-all cursor-pointer ${
                        modalStatus === s
                          ? s === "active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/40"
                            : s === "suspended"
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/40"
                          : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-850 dark:text-slate-400 dark:hover:bg-slate-750"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Approval Required Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Approval Required?
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    If bypassed, borrow requests are auto-approved.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalApproval(!modalApproval)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    modalApproval ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      modalApproval ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={handleCloseEdit}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateStudent}
                disabled={isUpdating}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/10 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isUpdating && <Loader2 className="h-3 w-3 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
