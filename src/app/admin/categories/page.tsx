"use client";

import React, { useState } from "react";
import { Grid, Plus, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const INITIAL_CATEGORIES = [
  { id: "cat-1", name: "Science Fiction", bookCount: 234 },
  { id: "cat-2", name: "Romance", bookCount: 189 },
  { id: "cat-3", name: "Business", bookCount: 156 },
  { id: "cat-4", name: "Education", bookCount: 298 },
  { id: "cat-5", name: "Fiction", bookCount: 445 },
  { id: "cat-6", name: "Technology", bookCount: 167 },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);

  const handleAddCategory = () => {
    toast.info("Category creation is disabled in demo mode.");
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Grid className="h-7 w-7 text-blue-600 shrink-0" />
            <span>Categories Management</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            Organize books into genres and subject areas
          </p>
        </div>
        <button
          onClick={handleAddCategory}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>New Category</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100/80 shadow-sm dark:bg-slate-900 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4 font-semibold">Category Name</th>
              <th className="p-4 font-semibold">Total Books</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
            {categories.map((cat) => (
              <tr key={cat.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                <td className="p-4 font-bold text-slate-800 dark:text-slate-200">{cat.name}</td>
                <td className="p-4 font-semibold text-slate-500 dark:text-slate-400">{cat.bookCount} books</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => toast.info("Editing category is disabled.")}
                      className="p-1.5 border border-slate-150 hover:bg-slate-50 hover:text-blue-600 rounded-lg dark:border-slate-800 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => toast.info("Deleting category is disabled.")}
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
