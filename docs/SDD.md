# SDD

## Architecture

Feature Based Architecture

---

## Frontend

Next.js latest (16)

React 19

TypeScript

TailwindCSS v4

Shadcn UI

GSAP

TanStack Query

React Hook Form

Zod

---

## Backend

Supabase

Authentication

Database

Storage

---

## External API

BukuAcak API

Book Data Source

---

## Folder Structure

src

├── app
├── features
├── components
├── providers
├── services
├── hooks
├── lib
├── types
├── utils
└── styles

# Installation Commands

pnpm add 
@supabase/supabase-js 
@tanstack/react-query 
react-hook-form 
@hookform/resolvers 
zod 
lucide-react 
gsap 
sonner 
clsx 
tailwind-merge 
date-fns 
recharts 
next-themes

Initialize Shadcn UI:

npx shadcn@latest init

Required Shadcn Components:

npx shadcn@latest add 
button 
input 
textarea 
label 
card 
avatar 
badge 
table 
dialog 
sheet 
dropdown-menu 
tabs 
form 
select 
skeleton 
separator 
alert-dialog 
sonner

## Design Source of Truth

The UI implementation must follow:

docs/design/

If a conflict occurs:

Design screenshots take precedence over generated UI.

Component hierarchy and layout must visually match the screenshots as closely as possible.

# BukuAcak Service Layer

src/services/bukuacak/

get-books.ts

get-book.ts

get-random-book.ts

get-genre-statistics.ts

reader-content.ts

Purpose:

Abstract all BukuAcak API requests behind reusable service functions.

All pages must consume services instead of calling fetch directly.