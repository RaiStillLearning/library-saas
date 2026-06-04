-- =====================================================================
-- ReadSpace — OpenLibrary Reading Module
-- Run this in Supabase SQL Editor
-- =====================================================================

-- 1. Reading History (tracks recently opened books)
CREATE TABLE IF NOT EXISTS public.reading_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    work_id TEXT NOT NULL,           -- OpenLibrary work key e.g. "OL123W"
    book_title TEXT NOT NULL,
    book_cover TEXT,
    book_author TEXT,
    edition_id TEXT,                  -- last edition opened
    last_opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, work_id)
);

-- 2. Reading Lists (Want to Read / Currently Reading / Finished)
CREATE TABLE IF NOT EXISTS public.reading_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    work_id TEXT NOT NULL,
    book_title TEXT NOT NULL,
    book_cover TEXT,
    book_author TEXT,
    list_type TEXT DEFAULT 'want_to_read'
        CHECK (list_type IN ('want_to_read', 'currently_reading', 'finished')),
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, work_id)
);

-- 3. Row-Level Security
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_lists ENABLE ROW LEVEL SECURITY;

-- 4. Policies: reading_history
CREATE POLICY "Users can view own reading history"
    ON public.reading_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading history"
    ON public.reading_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading history"
    ON public.reading_history FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reading history"
    ON public.reading_history FOR DELETE USING (auth.uid() = user_id);

-- 5. Policies: reading_lists
CREATE POLICY "Users can view own reading list"
    ON public.reading_lists FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reading list"
    ON public.reading_lists FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reading list"
    ON public.reading_lists FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete from own reading list"
    ON public.reading_lists FOR DELETE USING (auth.uid() = user_id);
