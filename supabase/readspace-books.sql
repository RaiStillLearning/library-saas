-- =====================================================================
-- ReadSpace Books Module — Internal Library Inventory
-- Run this in Supabase SQL Editor to create the required tables.
-- =====================================================================

-- 1. Internal book inventory managed by Admin
CREATE TABLE IF NOT EXISTS public.readspace_books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    isbn TEXT,
    publisher TEXT,
    published_year INTEGER,
    description TEXT,
    cover_url TEXT,
    total_stock INTEGER NOT NULL DEFAULT 1,
    available_stock INTEGER NOT NULL DEFAULT 1,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Borrowing records for ReadSpace internal books
CREATE TABLE IF NOT EXISTS public.readspace_borrowings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.readspace_books(id) ON DELETE CASCADE NOT NULL,
    borrow_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row-Level Security
ALTER TABLE public.readspace_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readspace_borrowings ENABLE ROW LEVEL SECURITY;

-- 4. Policies for readspace_books
-- Admins can do anything (role = 'admin' in profiles table)
CREATE POLICY "Admins can manage readspace_books" ON public.readspace_books
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- All authenticated users can read books
CREATE POLICY "Users can view readspace_books" ON public.readspace_books
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. Policies for readspace_borrowings
-- Users can view their own borrowings
CREATE POLICY "Users can view own borrowings" ON public.readspace_borrowings
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own borrowings
CREATE POLICY "Users can insert own borrowings" ON public.readspace_borrowings
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own borrowings (return)
CREATE POLICY "Users can update own borrowings" ON public.readspace_borrowings
    FOR UPDATE USING (user_id = auth.uid());

-- Admins can view all borrowings
CREATE POLICY "Admins can view all borrowings" ON public.readspace_borrowings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins can update any borrowing (for return processing)
CREATE POLICY "Admins can update all borrowings" ON public.readspace_borrowings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 6. Seed example books (optional)
INSERT INTO public.readspace_books (title, author, isbn, publisher, published_year, description, cover_url, total_stock, available_stock, category)
VALUES
    ('The Great Gatsby', 'F. Scott Fitzgerald', '9780743273565', 'Scribner', 1925, 'A story of wealth, love, and the American Dream in the Jazz Age.', '', 3, 3, 'Fiction'),
    ('To Kill a Mockingbird', 'Harper Lee', '9780061935466', 'HarperCollins', 1960, 'A classic of American literature about racial injustice in the Deep South.', '', 5, 5, 'Fiction'),
    ('1984', 'George Orwell', '9780451524935', 'Signet Classic', 1949, 'A dystopian social science fiction novel and cautionary tale.', '', 4, 4, 'Science Fiction'),
    ('Clean Code', 'Robert C. Martin', '9780132350884', 'Prentice Hall', 2008, 'A handbook of agile software craftsmanship.', '', 2, 2, 'Technology'),
    ('Atomic Habits', 'James Clear', '9780735211292', 'Avery', 2018, 'An easy and proven way to build good habits and break bad ones.', '', 3, 3, 'Self-Help')
ON CONFLICT DO NOTHING;
