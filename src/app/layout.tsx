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
    default: "ReadSpace — Your Modern Reading Platform & Digital Book Library",
    template: "%s | ReadSpace",
  },
  description:
    "ReadSpace (Read Space) adalah platform perpustakaan digital modern untuk membaca buku online, mencari buku dari Gramedia & OpenLibrary, dan mengelola library pribadi Anda secara instan.",
  keywords: [
    "readspace",
    "read space",
    "buku",
    "book",
    "library",
    "perpustakaan",
    "perpustakaan digital",
    "digital library",
    "baca buku online",
    "online reading",
    "e-library",
    "baca buku gratis",
    "katalog buku",
    "book discovery",
    "openlibrary",
    "gramedia",
    "pinjam buku",
    "buku indonesia",
    "reading list",
    "baca online",
  ],
  authors: [{ name: "ReadSpace" }],
  creator: "ReadSpace",
  alternates: {
    canonical: "https://kamarprogrammer.site",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://kamarprogrammer.site",
    siteName: "ReadSpace",
    title: "ReadSpace — Your Modern Reading Platform & Digital Library",
    description:
      "Cari, baca, dan kelola buku Anda di ReadSpace. Akses jutaan judul buku dari Gramedia dan OpenLibrary, pinjam buku perpustakaan secara online, dan lacak progres membaca Anda.",
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
    title: "ReadSpace — Your Modern Reading Platform & Digital Library",
    description:
      "Cari, baca, dan kelola buku Anda di ReadSpace. Platform baca buku & e-library terlengkap.",
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "ReadSpace",
                alternateName: ["Read Space", "ReadSpace Library"],
                url: "https://kamarprogrammer.site",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate:
                      "https://kamarprogrammer.site/discover?q={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
                description:
                  "ReadSpace is a modern reading platform combining book discovery (Gramedia), digital reading (OpenLibrary), and personal library management.",
              },
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "ReadSpace",
                url: "https://kamarprogrammer.site",
                logo: "https://kamarprogrammer.site/favicon.ico",
                sameAs: [],
              },
            ]),
          }}
        />
      </head>
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
