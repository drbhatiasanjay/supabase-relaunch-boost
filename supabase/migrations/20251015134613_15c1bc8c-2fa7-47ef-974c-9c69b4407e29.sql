-- Backfill existing rows for the new read column and enforce NOT NULL
UPDATE public.bookmarks SET read = false WHERE read IS NULL;
ALTER TABLE public.bookmarks ALTER COLUMN read SET NOT NULL;