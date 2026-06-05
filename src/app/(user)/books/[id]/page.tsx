import React from "react";
import type { Metadata } from "next";
import { getBookById } from "@/src/services/api/books";
import BookDetailClient from "./BookDetailClient";

interface BookDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: BookDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const book = await getBookById(id);
    if (!book) return { title: "Book Not Found | ReadSpace" };

    const title = `${book.title} by ${book.author.name} | ReadSpace`;
    const description = `Baca, simpan, dan pinjam buku "${book.title}" karya ${book.author.name} (kategori ${book.category.name}) secara online di ReadSpace perpustakaan digital.`;

    return {
      title,
      description,
      keywords: [
        book.title.toLowerCase(),
        book.author.name.toLowerCase(),
        book.category.name.toLowerCase(),
        "readspace",
        "buku",
        "book",
        "library",
        "perpustakaan",
        "pinjam buku",
      ],
      alternates: {
        canonical: `https://readspace.vercel.app/books/${id}`,
      },
      openGraph: {
        title,
        description,
        type: "book",
        url: `https://readspace.vercel.app/books/${id}`,
        images: [
          {
            url: book.cover_image,
            alt: book.title,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [book.cover_image],
      },
    };
  } catch (e) {
    return {
      title: "Book Details | ReadSpace",
      alternates: {
        canonical: `https://readspace.vercel.app/books/${id}`,
      },
    };
  }
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;
  const book = await getBookById(id).catch(() => null);

  const bookSchema = book
    ? {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": book.title,
        "image": book.cover_image,
        "description": book.summary,
        "isbn": book.details?.isbn && book.details.isbn !== "0" ? book.details.isbn : undefined,
        "numberOfPages": book.details?.total_pages ? parseInt(book.details.total_pages) || undefined : undefined,
        "publisher": book.publisher || "Gramedia",
        "author": {
          "@type": "Person",
          "name": book.author.name,
        },
        "genre": book.category.name,
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://readspace.vercel.app"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Discover Books",
        "item": "https://readspace.vercel.app/discover"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": book ? book.title : "Book Details",
        "item": `https://readspace.vercel.app/books/${id}`
      }
    ]
  };

  return (
    <>
      {bookSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(bookSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <BookDetailClient id={id} />
    </>
  );
}

