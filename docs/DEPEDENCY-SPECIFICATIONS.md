# Dependency Specification

The project must use ONLY the following dependencies.

AI agents must not introduce alternative libraries unless explicitly approved.

---

## Core Framework

next
react
react-dom
typescript

---

## Backend

@supabase/supabase-js

Purpose:
- Authentication
- Database
- Storage

---

## Data Fetching

@tanstack/react-query

Purpose:
- API Requests
- Caching
- Pagination
- Refetching
- Optimistic Updates

---

## Forms & Validation

react-hook-form

@hookform/resolvers

zod

Purpose:
- Form Management
- Client Validation
- Schema Validation

---

## UI Components

shadcn/ui

Required Components:

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

---

## Styling

tailwindcss

tailwind-merge

clsx

Purpose:
- Styling
- Utility Merging
- Conditional Classes

---

## Icons

lucide-react

Purpose:
- Consistent Icon System

---

## Animation

gsap

Purpose:
- Hero Animations
- Scroll Animations
- Page Transitions
- Card Reveals

Do not use:
- Framer Motion

---

## Notifications

sonner

Purpose:
- Success Toasts
- Error Toasts
- Warning Toasts

Do not use:
- react-toastify

---

## Dates

date-fns

Purpose:
- Formatting Dates
- Borrowing Due Dates
- Relative Time

---

## Tables

Use:
- Native Shadcn Table

Do not install:
- AG Grid
- Material Table

---

## Charts

recharts

Purpose:
- Admin Reports
- Borrowing Statistics

Only used in:
- Admin Reports Page

---

## Theme

next-themes

Purpose:
- Dark Mode Support
- Theme Persistence

Optional for MVP

---

## Development Tools

eslint

prettier

typescript

---

## Explicitly Forbidden

redux

zustand

mobx

axios

prisma

framer-motion

material-ui

chakra-ui

ant-design

bootstrap

jquery

Reason:
Avoid unnecessary complexity and maintain a consistent architecture.