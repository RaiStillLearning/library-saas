"use client";

import React, { useEffect, useRef } from "react";
import { BookOpen, HelpCircle } from "lucide-react";
import { LoginForm } from "@/src/features/auth/components/login-form";
import { useAuth } from "@/src/features/auth/hooks/use-auth";
import { useRouter } from "next/navigation";
import gsap from "gsap";

export default function LoginPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const rightPaneRef = useRef<HTMLDivElement>(null);

  // Redirect to home if user is logged in
  useEffect(() => {
    if (!isLoading && user) {
      if (user.email?.toLowerCase().includes("admin")) {
        router.push("/admin");
      } else {
        router.push("/");
      }
    }
  }, [user, isLoading, router]);

  // GSAP Entrance Animations
  useEffect(() => {
    const leftPane = leftPaneRef.current;
    const rightPane = rightPaneRef.current;

    if (leftPane && rightPane) {
      const ctx = gsap.context(() => {
        // Animate left pane elements
        gsap.fromTo(
          ".animate-logo",
          { opacity: 0, y: -20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
        );
        gsap.fromTo(
          ".animate-quote",
          { opacity: 0, x: -30 },
          { opacity: 1, x: 0, duration: 1, delay: 0.2, ease: "power3.out" }
        );
        gsap.fromTo(
          ".animate-footer",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, delay: 0.4, ease: "power3.out" }
        );

        // Animate right pane form card
        gsap.fromTo(
          ".animate-form",
          { opacity: 0, scale: 0.95, y: 30 },
          { opacity: 1, scale: 1, y: 0, duration: 0.8, ease: "back.out(1.2)" }
        );

        // Animate question mark button
        gsap.fromTo(
          ".animate-help",
          { opacity: 0, scale: 0 },
          { opacity: 1, scale: 1, duration: 0.5, delay: 0.6, ease: "back.out(1.7)" }
        );
      });

      return () => ctx.revert();
    }
  }, []);

  if (isLoading || user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <BookOpen className="h-12 w-12 text-blue-600 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50 dark:bg-slate-950 font-sans overflow-hidden">
      {/* Left Column: Quote & Branding */}
      <div
        ref={leftPaneRef}
        className="hidden lg:flex flex-col justify-between p-16 relative bg-[#5e52f3] text-white"
      >
        {/* Top Branding Logo */}
        <div className="flex items-center gap-3 animate-logo">
          <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">ReadSpace</span>
        </div>

        {/* Center Quote */}
        <div className="flex-1 flex flex-col justify-center max-w-xl pr-6 animate-quote">
          <blockquote className="space-y-6">
            <p className="text-[32px] font-medium leading-relaxed tracking-tight text-white/95">
              &ldquo;A reader lives a thousand lives before he dies. The man who never reads lives only one.&rdquo;
            </p>
            <footer className="text-lg text-white/70 font-medium">
              &mdash; George R.R. Martin
            </footer>
          </blockquote>
        </div>

        {/* Footer info */}
        <div className="text-sm text-white/60 animate-footer">
          &copy; 2026 ReadSpace. All rights reserved.
        </div>
      </div>

      {/* Right Column: Form Card */}
      <div
        ref={rightPaneRef}
        className="flex flex-col items-center justify-center p-6 sm:p-12 md:p-16 relative min-h-screen bg-[#F8FAFC] dark:bg-slate-950"
      >
        {/* Mobile branding header */}
        <div className="flex items-center gap-2 lg:hidden absolute top-8 left-8">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-slate-900 dark:text-slate-50">ReadSpace</span>
        </div>

        {/* Centered LoginForm card */}
        <div className="animate-form w-full flex justify-center">
          <LoginForm />
        </div>

        {/* Help Floating Button bottom-right */}
        <button
          onClick={() => {
            alert(
              "ReadSpace Demo Credentials:\n\n" +
              "• Student Account:\n  Email: student@readspace.com\n  Password: any password\n\n" +
              "• Admin Account:\n  Email: admin@readspace.com\n  Password: any password\n\n" +
              "You can also register a new account using the 'Sign up' link!"
            );
          }}
          className="animate-help absolute bottom-6 right-6 p-3 bg-slate-900 text-white rounded-full shadow-lg hover:bg-slate-800 transition-transform active:scale-95 cursor-pointer dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
          aria-label="Help information"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
