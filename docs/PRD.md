# PRD

## Product Name

ReadSpace

## Product Vision

ReadSpace is a modern SaaS digital reading platform focused on book discovery, digital reading, and personal library management.

The product combines the experience of Kindle, Medium, and Google Books while maintaining library management functionality required by educational institutions.

---

## Problem Statement

Traditional library systems focus heavily on administration.

Users want:

- Better book discovery
- Better reading experience
- Reading continuity across sessions
- Modern user experience

---

## Target Users

### Student

Primary user.

### General Reader

Public user.

### Admin

Library manager.

---

## Product Positioning

Reading First

Administration Second

---

## MVP Features

Authentication

Book Discovery

Digital Reader

Borrowing

Returns

History

Profile

Admin Management

Reports

---

## Success Metrics

User can find books in under 10 seconds.

User can open books within 3 clicks.

User can continue reading seamlessly.

# Reader Page Specification

Route:

/books/[id]/read

Purpose:

Provide a distraction-free digital reading experience similar to Kindle, Medium, and Google Books.

Data Source:

BukuAcak API

Book Detail:

GET /api/v1/book/{id}

Behavior:

If readable content is available:

- Open Reader
- Display digital content
- Save reading progress
- Allow continue reading

If readable content is unavailable:

- Show Preview Mode
- Show Book Metadata
- Show Borrow / Save actions

Layout:

Header
- Book Title
- Author
- Reading Progress
- Bookmark Button
- Exit Reader Button

Main Content Area
- Centered reading column
- Max width 720px
- Large typography
- Comfortable line height
- Reading optimized spacing

Sidebar (Desktop Only)
- Table of Contents
- Chapter Navigation
- Bookmarks

Bottom Progress Bar
- Current Progress
- Estimated Time Remaining

Features:

- Continue Reading
- Reading Progress
- Bookmark Pages
- Chapter Navigation
- Reading Statistics

Responsive:

Mobile:
- Fullscreen Reader
- Floating Controls

Tablet:
- Reader + Collapsible Navigation

Desktop:
- Reader + Sidebar Navigation