# Database Design

profiles

id
email
name
avatar_url
role

categories

id
name
slug

books

id
external_id
title
author
description
cover_url
category_id
stock
available_stock

borrowings

id
user_id
book_id
borrow_date
due_date
return_date
status

reading_progress

id
user_id
book_id
progress_percentage
last_read_at

favorites

id
user_id
book_id

bookmarks

id
user_id
book_id
position