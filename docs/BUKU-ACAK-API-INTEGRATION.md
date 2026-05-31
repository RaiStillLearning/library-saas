# BukuAcak API Integration

Source:

https://bukuacak.vercel.app/api

Purpose:

Read-only public catalog.

The API is used for:

- Discover Books
- Book Detail
- Categories
- Recommendations

The API is NOT used for:

- Authentication
- Borrowing
- Reading Progress
- User Data
- Admin CRUD

Those remain in Supabase.

# GET Books With Filter
source:
https://api.bukuacak.shabsolute.tech/api/v1/book?sort={urut}&page={angka}&year={tahun}&genre={genre}&keyword={kata kunci}
example:
https://api.bukuacak.shabsolute.tech/api/v1/book?page=1&year=2023&genre=Self-Improvement&keyword=Berani

# GET Book by_ID
source:
https://api.bukuacak.shabsolute.tech/api/v1/book/{_id}
example:
https://api.bukuacak.shabsolute.tech/api/v1/book/6780fe7e1e0f1c11c617c2a2

# GET Book By Query Parameter
source: 
https://api.bukuacak.shabsolute.tech/api/v1/book?_id={_id}
example:
https://api.bukuacak.shabsolute.tech/api/v1/book?_id=67822def79bd51cee772b4dc

# GET Random Book
Source:
https://api.bukuacak.shabsolute.tech/api/v1/random_book?year={tahun}&genre={genre}&keyword={kata kunci}
example:
https://api.bukuacak.shabsolute.tech/api/v1/random_book?year=2023&genre=mystery&keyword=detective

# GET Genre Statistic
source:
https://api.bukuacak.shabsolute.tech/api/v1/stats/genre
example:
https://api.bukuacak.shabsolute.tech/api/v1/stats/genre


# BukuAcak API Limitations

The API provides metadata only.

Available:

- Title
- Cover
- Author
- Publisher
- Summary
- ISBN
- Categories

Unavailable:

- PDF
- EPUB
- Chapter Data
- Reading Content
- Reader Navigation

AI agents must not implement a digital reader feature unless a valid content source is introduced.