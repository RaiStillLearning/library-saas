# ReadSpace MVP — Final Architecture Summary

## Overview

ReadSpace adalah platform perpustakaan digital dengan 3 domain yang dipisahkan secara jelas.

| Domain | Source | Purpose |
|----------|----------|----------|
| Gramedia | BukuAcak API | Discovery & Search |
| OpenLibrary | OpenLibrary API | Online Reading |
| ReadSpace Books | Internal Database | Borrowing & Library Management |

Setiap domain memiliki tanggung jawab tunggal dan tidak berbagi source of truth.

---

# User Roles

## Admin

Dapat:

- Login
- Kelola siswa
- Kelola katalog ReadSpace Books
- Approve / Reject peminjaman
- Return buku
- Mark fine as paid
- Melihat analytics
- Melihat audit timeline

Tidak dapat:

- Self-register

---

## Student

Dapat:

- Login
- Search buku
- Membaca buku OpenLibrary
- Mengajukan peminjaman
- Melihat history
- Melihat timeline aktivitas
- Melihat status denda

Tidak dapat:

- Register sendiri
- Approve peminjaman
- Mengubah stok buku

---

# Student Lifecycle

## Account Status

```
active | suspended | graduated
```

### Active

- Dapat login
- Dapat meminjam

### Suspended

- Login ditolak
- Tidak dapat meminjam

### Graduated

- Login tetap bisa
- Tidak dapat melakukan peminjaman baru

---

# Borrowing Rules

## Constants

```javascript
export const BORROWING_RULES = {
  DURATION_DAYS: 14,
  LATE_FINE_AMOUNT: 30000,
  MAX_ACTIVE_BORROWINGS: 3,
  PENDING_EXPIRATION_DAYS: 7,
}
```

---

# Borrowing Workflow

## Request Creation

Saat siswa meminjam:

Validasi:
- Account status aktif
- Tidak memiliki denda belum dibayar
- Tidak melebihi batas peminjaman
- Tidak meminjam buku yang sama
- Buku masih tersedia

---

## Approval Flow

Jika:

```
approval_required = true
```

Maka:

```
pending
```

dibuat.

Admin dapat:

```
approve | reject
```

---

## Pending Expiration

Jika request:

```
pending > 7 hari
```

maka otomatis:

```
expired
```

dan:
- Notifikasi dibuat
- Timeline dicatat

---

## Approval

Saat approve:
- Stock berkurang
- `borrowed_at` dibuat
- `due_date` dibuat (+14 hari)
- Status menjadi `borrowed`

---

## Rejection

Saat reject:

```
status = rejected
```

Timeline dicatat.

---

# Borrowing Status Lifecycle

```
pending | borrowed | overdue | returned | rejected | expired
```

---

# Overdue System

Setiap load data:

```
today > due_date
```

maka:

```
borrowed -> overdue
```

dan:
- Notification dibuat
- Timeline dicatat

---

# Fine System

## Fine Rule

Jika:

```
returned_at > due_date
```

maka:

```
fine_amount = 30000
fine_paid = false
```

---

## Historical Preservation

Fine disimpan ke record transaksi.

Contoh:

```
30000
```

tetap tersimpan walaupun:

```javascript
LATE_FINE_AMOUNT = 50000
```

diubah di masa depan.

---

## Fine Payment

Admin dapat:

```
Mark Paid
```

yang mengubah:

```
fine_paid = true
paid_at = timestamp
```

---

## Borrow Block

Jika siswa memiliki:

```
fine_amount > 0 AND fine_paid = false
```

maka:

```
borrowing blocked
```

---

# Borrow Limits

Maksimal:

```
3
```

peminjaman aktif.

Status yang dihitung:

```
pending | borrowed | overdue
```

---

# Duplicate Borrow Protection

Tidak boleh:

```
Student A & Book X
```

memiliki lebih dari satu:

```
pending | borrowed | overdue
```

untuk buku yang sama.

---

# Borrow Codes

Format:

```
BRW-2026-000001
```

## Mock Mode

Menggunakan:

```
readspace_borrow_counter
```

---

## Supabase Mode

Menggunakan:

```sql
SEQUENCE & TRIGGER
```

untuk mencegah race condition.

---

# Audit Trail

## Timeline Events

```
borrow_request_created
borrow_request_approved
borrow_request_rejected
borrow_request_expired
borrow_overdue
borrow_returned
fine_generated
fine_paid
```

---

## Metadata

Semua timeline event mendukung:

```json
{
  "borrow_code": "",
  "borrowed_at": "",
  "returned_at": "",
  "due_date": ""
}
```

untuk kebutuhan audit.

---

# Notifications

## Student Notifications

- Borrow approved
- Borrow rejected
- Borrow expired
- Borrow overdue

---

## Admin Notifications

- Borrow request submitted

---

# ReadSpace Books

## Admin

CRUD penuh:
- Create
- Edit
- Delete
- Stock Management

---

## Student

Dapat:
- Browse
- Search
- Borrow

---

# OpenLibrary Module

## Features

- Search
- Browse
- Read online
- Reading lists
- Reading history

---

## Reading Lists

```
Want To Read | Currently Reading | Finished
```

---

## Recently Opened

Homepage menampilkan:

```
Recently Opened
```

berdasarkan reading history.

---

# Analytics

## Admin Dashboard

### Borrowing Analytics
- Active Borrowings
- Pending Requests
- Overdue Books
- Returned Books

### Student Analytics
- Total Students
- Active Students
- Suspended Students
- Graduated Students

### Timeline Feed
Menampilkan aktivitas terbaru.

---

# Student Dashboard

Menampilkan:

## Statistics

- Active Loans
- Pending Requests
- Overdue Books
- Outstanding Fines

---

## Due Date Reminders

```
Due in X days | Due today | Overdue
```

---

## Active Loans Section

Menampilkan:
- Book title
- Due date
- Remaining days

---

# Security Rules

## Login Restrictions

Suspended users:

```
cannot login
```

---

## Borrow Restrictions

Blocked jika:
- Suspended
- Graduated
- Unpaid fine
- Borrow limit reached
- Duplicate borrow

---

# Reliability Improvements

## Mock Storage Limits

Timeline:

```
100 events
```

maksimum.

Notifications:

```
50 notifications
```

maksimum.

---

# Production Freeze Scope

Included:
- Authentication
- Student Management
- Borrow Approval
- Overdue Handling
- Fine System
- Notifications
- Timeline
- Analytics
- OpenLibrary Reading
- ReadSpace Books CRUD
- Borrow Codes
- Audit Trail

Excluded (Future Versions):
- Email notifications
- WhatsApp notifications
- Payment gateway
- QR borrowing
- Barcode scanner
- PDF receipts
- CSV export
- Reservation queue
- Waitlist
- Multi-library support
- Real-time synchronization

---

# Final Status

Architecture: Mature MVP

Ready For:
- School Project
- PKL
- Portfolio
- Demo SaaS
- Small Production Deployment

Current Focus:
- Bug Fixing
- Responsive Improvements
- Accessibility
- Testing
- Deployment

No new features should be added before release.
