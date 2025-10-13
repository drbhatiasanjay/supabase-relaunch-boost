-- Create folders table for hierarchical organization
CREATE TABLE public.folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT folders_user_id_name_parent_unique UNIQUE (user_id, name, parent_id)
);

-- Enable RLS on folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for folders
CREATE POLICY "Users can view own folders"
ON public.folders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders"
ON public.folders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
ON public.folders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
ON public.folders FOR DELETE
USING (auth.uid() = user_id);

-- Create tags table for better tag management
CREATE TABLE public.tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT tags_user_id_name_unique UNIQUE (user_id, name)
);

-- Enable RLS on tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tags
CREATE POLICY "Users can view own tags"
ON public.tags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tags"
ON public.tags FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tags"
ON public.tags FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tags"
ON public.tags FOR DELETE
USING (auth.uid() = user_id);

-- Add folder_id to bookmarks table
ALTER TABLE public.bookmarks
ADD COLUMN folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_bookmarks_folder_id ON public.bookmarks(folder_id);
CREATE INDEX idx_folders_parent_id ON public.folders(parent_id);
CREATE INDEX idx_folders_user_id ON public.folders(user_id);
CREATE INDEX idx_tags_user_id ON public.tags(user_id);

-- Trigger for folders updated_at
CREATE TRIGGER update_folders_updated_at
BEFORE UPDATE ON public.folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();