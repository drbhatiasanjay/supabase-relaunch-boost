-- Add read column to bookmarks table
ALTER TABLE public.bookmarks 
ADD COLUMN read boolean DEFAULT false;

-- Add index for better performance on read/reading queries
CREATE INDEX idx_bookmarks_reading_read ON public.bookmarks(user_id, reading, read) WHERE reading = true;