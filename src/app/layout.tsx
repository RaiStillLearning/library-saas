import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/src/providers/query-provider";
import { SupabaseProvider } from "@/src/providers/supabase-provider";
import { Toaster } from "@/src/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReadSpace — Digital Library",
  description:
    "A modern SaaS digital reading platform for book discovery, digital reading, and personal library management.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <QueryProvider>
          <SupabaseProvider>
            {children}
            <Toaster richColors position="top-right" />
          </SupabaseProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
