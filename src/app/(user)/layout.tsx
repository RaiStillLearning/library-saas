"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import { UserSidebar } from "@/src/components/layout/user-sidebar";
import { TopBar } from "@/src/components/layout/top-bar";
import { BookOpen } from "lucide-react";
import { ErrorBoundary } from "@/src/components/shared/error-boundary";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <BookOpen className="h-12 w-12 text-blue-600 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Checking authorization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar navigation */}
      <UserSidebar />

      {/* Main content pane */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-[#F8FAFC] dark:bg-slate-950 transition-colors p-6 md:p-8 relative">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
