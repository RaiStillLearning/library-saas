-- =====================================================================
-- ReadSpace MVP — Database Schema Updates
-- Run this in your Supabase SQL Editor to apply updates.
-- =====================================================================

-- 1. Update Profiles Table
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'suspended', 'graduated')) DEFAULT 'active';

-- 2. Update ReadSpace Borrowings Table
ALTER TABLE public.readspace_borrowings
    ADD COLUMN IF NOT EXISTS borrow_code TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS borrowed_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS returned_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS fine_amount INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS fine_paid BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

-- 3. Update Status Constraints
-- Drop old inline status check constraint if it exists (usually auto-named like table_column_check)
ALTER TABLE public.readspace_borrowings 
    DROP CONSTRAINT IF EXISTS readspace_borrowings_status_check;

-- Add updated status check constraint supporting pending, rejected, and expired states
ALTER TABLE public.readspace_borrowings 
    ADD CONSTRAINT readspace_borrowings_status_check 
    CHECK (status IN ('pending', 'borrowed', 'returned', 'overdue', 'rejected', 'expired'));

-- Update default status
ALTER TABLE public.readspace_borrowings 
    ALTER COLUMN status SET DEFAULT 'borrowed';

-- 4. Automatic Transaction-Safe Borrow Code Generation
CREATE SEQUENCE IF NOT EXISTS public.readspace_borrow_code_seq START WITH 1;

CREATE OR REPLACE FUNCTION public.generate_readspace_borrow_code()
RETURNS TRIGGER AS $$
DECLARE
    year_val TEXT;
    next_val INT;
    seq_val TEXT;
BEGIN
    IF NEW.borrow_code IS NULL THEN
        year_val := to_char(CURRENT_DATE, 'YYYY');
        next_val := nextval('public.readspace_borrow_code_seq');
        seq_val := lpad(next_val::text, 6, '0');
        NEW.borrow_code := 'BRW-' || year_val || '-' || seq_val;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to prevent duplicate triggers
DROP TRIGGER IF EXISTS trg_generate_readspace_borrow_code ON public.readspace_borrowings;

CREATE TRIGGER trg_generate_readspace_borrow_code
    BEFORE INSERT ON public.readspace_borrowings
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_readspace_borrow_code();

-- 5. Update Activities Type Constraint
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE public.activities ADD CONSTRAINT activities_type_check CHECK (type IN (
    'borrowed', 'returned', 'started_reading', 'added_to_list', 'finished_reading',
    'borrow_request_created', 'borrow_request_approved', 'borrow_request_rejected',
    'borrow_request_expired', 'borrow_overdue', 'borrow_returned', 'fine_generated', 'fine_paid'
));

