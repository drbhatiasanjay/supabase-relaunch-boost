-- Performance indexes for bookmarks table
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_folder_id ON public.bookmarks(folder_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_reading ON public.bookmarks(reading) WHERE reading = true;
CREATE INDEX IF NOT EXISTS idx_bookmarks_created_at ON public.bookmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON public.bookmarks USING GIN(tags);

-- Full-text search index for bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_search ON public.bookmarks USING GIN(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(url, ''))
);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_folder ON public.bookmarks(user_id, folder_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_reading ON public.bookmarks(user_id, reading);

-- Performance indexes for folders table
CREATE INDEX IF NOT EXISTS idx_folders_user_id ON public.folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON public.folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_user_parent ON public.folders(user_id, parent_id);

-- Performance indexes for tags table
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_user_name ON public.tags(user_id, name);

-- Performance indexes for profiles table (critical for telegram bot)
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id) WHERE telegram_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_phone_number ON public.profiles(phone_number) WHERE phone_number IS NOT NULL;

-- Analyze tables to update statistics for query planner
ANALYZE public.bookmarks;
ANALYZE public.folders;
ANALYZE public.tags;
ANALYZE public.profiles;