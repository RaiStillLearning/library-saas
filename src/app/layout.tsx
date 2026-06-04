import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/src/providers/query-provider";
import { SupabaseProvider } from "@/src/providers/supabase-provider";
import { ThemeProvider } from "@/src/providers/theme-provider";
import { Toaster } from "@/src/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ReadSpace — Your Modern Reading Platform",
    template: "%s | ReadSpace",
  },
  description:
    "ReadSpace is a modern SaaS reading platform combining book discovery (Gramedia), digital reading (OpenLibrary), and personal library management — all in one place.",
  keywords: ["digital library", "book discovery", "online reading", "openlibrary", "gramedia", "e-library", "readspace"],
  authors: [{ name: "ReadSpace" }],
  creator: "ReadSpace",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://readspace.vercel.app",
    siteName: "ReadSpace",
    title: "ReadSpace — Your Modern Reading Platform",
    description:
      "Discover, read, and manage books on ReadSpace. Search millions of titles from Gramedia and OpenLibrary, borrow from the internal library, and track your reading journey.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ReadSpace — Modern Reading Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReadSpace — Your Modern Reading Platform",
    description: "Discover, read, and manage books on ReadSpace.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
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
          <ThemeProvider>
            <SupabaseProvider>
              {children}
              <Toaster richColors position="top-right" />
            </SupabaseProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
