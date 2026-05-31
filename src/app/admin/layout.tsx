"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import { AdminSidebar } from "@/src/components/layout/admin-sidebar";
import { TopBar } from "@/src/components/layout/top-bar";
import { BookOpen } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/src/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  // Auto-close mobile sidebar drawer when switching pages
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

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
      {/* Overlay Background for mobile sidebar drawer */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar navigation container with responsive translation */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 lg:static lg:block transition-transform duration-300 lg:translate-x-0 shrink-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* Main content pane */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <TopBar
          searchPlaceholder="Search administration..."
          onMenuClick={() => setIsSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-slate-950 transition-colors p-6 md:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
