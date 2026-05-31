"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import { AdminSidebar } from "@/src/components/layout/admin-sidebar";
import { TopBar } from "@/src/components/layout/top-bar";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (profile && profile.role !== "admin") {
        toast.error("Unauthorized. Admin access only.");
        router.push("/");
      }
    }
  }, [user, profile, isLoading, router]);

  if (isLoading || !user || (profile && profile.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <BookOpen className="h-12 w-12 text-blue-600 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Admin sidebar */}
      <AdminSidebar />

      {/* Main content pane */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <TopBar searchPlaceholder="Search administration..." />
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-slate-950 transition-colors p-6 md:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
