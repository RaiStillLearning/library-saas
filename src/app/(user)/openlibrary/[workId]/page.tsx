import React from "react";
import type { Metadata } from "next";
import {
  getWorkDetails,
  getAuthorDetails,
  getCoverUrl,
  extractDescription,
} from "@/src/services/api/openlibrary";
import OpenLibraryDetailClient from "./OpenLibraryDetailClient";

interface OpenLibraryDetailPageProps {
  params: Promise<{ workId: string }>;
}

export async function generateMetadata({ params }: OpenLibraryDetailPageProps): Promise<Metadata> {
  const { workId } = await params;
  try {
    const work = await getWorkDetails(workId);
    if (!work) return { title: "Book Not Found | ReadSpace" };

    let authorName = "";
    if (work.authors && work.authors.length > 0) {
      try {
        const author = await getAuthorDetails(work.authors[0].author.key);
        authorName = author.name || "";
      } catch {}
    }

    const authorSuffix = authorName ? ` by ${authorName}` : "";
    const title = `${work.title}${authorSuffix} | OpenLibrary | ReadSpace`;
    const rawDescription = extractDescription(work.description);
    const description = `Baca atau dapatkan preview buku "${work.title}"${authorSuffix} secara online di OpenLibrary via ReadSpace perpustakaan digital. ${rawDescription.slice(0, 120)}`;

    const coverId = work.covers?.[0];
    const coverUrl = coverId ? getCoverUrl(coverId, "L") : "";

    return {
      title,
      description,
      keywords: [
        work.title.toLowerCase(),
        authorName ? authorName.toLowerCase() : "",
        "readspace",
        "openlibrary",
        "baca buku online",
        "online library",
        "perpustakaan digital",
      ].filter(Boolean),
      alternates: {
        canonical: `https://readspace.vercel.app/openlibrary/${workId}`,
      },
      openGraph: {
        title,
        description,
        type: "book",
        url: `https://readspace.vercel.app/openlibrary/${workId}`,
        images: coverUrl ? [{ url: coverUrl, alt: work.title }] : [],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: coverUrl ? [coverUrl] : [],
      },
    };
  } catch (e) {
    return {
      title: "Book Details | OpenLibrary | ReadSpace",
      alternates: {
        canonical: `https://readspace.vercel.app/openlibrary/${workId}`,
      },
    };
  }
}

export default async function OpenLibraryDetailPage({ params }: OpenLibraryDetailPageProps) {
  const { workId } = await params;
  const work = await getWorkDetails(workId).catch(() => null);
  
  let authorName = "";
  if (work && work.authors && work.authors.length > 0) {
    try {
      const author = await getAuthorDetails(work.authors[0].author.key);
      authorName = author.name || "";
    } catch {}
  }

  const coverId = work?.covers?.[0];
  const coverUrl = coverId ? getCoverUrl(coverId, "L") : "";

  const bookSchema = work
    ? {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": work.title,
        "image": coverUrl || undefined,
        "description": extractDescription(work.description) || undefined,
        "author": authorName
          ? {
              "@type": "Person",
              "name": authorName,
            }
          : undefined,
        "publisher": "OpenLibrary",
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
        "name": "OpenLibrary Books",
        "item": "https://readspace.vercel.app/openlibrary"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": work ? work.title : "Book Details",
        "item": `https://readspace.vercel.app/openlibrary/${workId}`
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
      <OpenLibraryDetailClient workId={workId} />
    </>
  );
}

