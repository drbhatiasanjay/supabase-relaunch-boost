-- Function to get bookmarks by WhatsApp phone number
CREATE OR REPLACE FUNCTION public.get_bookmarks_by_whatsapp(
  p_phone_number TEXT,
  p_tag TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  folder_id UUID,
  title TEXT,
  url TEXT,
  description TEXT,
  category TEXT,
  tags TEXT[],
  read BOOLEAN,
  reading BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.user_id,
    b.folder_id,
    b.title,
    b.url,
    b.description,
    b.category,
    b.tags,
    b.read,
    b.reading,
    b.created_at,
    b.updated_at
  FROM bookmarks b
  INNER JOIN profiles p ON b.user_id = p.user_id
  WHERE p.phone_number = p_phone_number
    AND (p_tag IS NULL OR p_tag = ANY(b.tags))
  ORDER BY b.created_at DESC
  LIMIT 50;
END;
$$;

-- Function to add bookmark by WhatsApp phone number
CREATE OR REPLACE FUNCTION public.add_bookmark_by_whatsapp(
  p_phone_number TEXT,
  p_url TEXT,
  p_title TEXT DEFAULT NULL,
  p_tags TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  url TEXT,
  title TEXT,
  tags TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_tags_array TEXT[];
  v_bookmark_id UUID;
BEGIN
  -- Get user_id from phone_number
  SELECT user_id INTO v_user_id
  FROM profiles
  WHERE phone_number = p_phone_number;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found with phone_number: %', p_phone_number;
  END IF;
  
  -- Parse tags
  IF p_tags IS NOT NULL AND p_tags != '' THEN
    v_tags_array := string_to_array(p_tags, ',');
    v_tags_array := ARRAY(SELECT trim(unnest(v_tags_array)));
  ELSE
    v_tags_array := ARRAY[]::TEXT[];
  END IF;
  
  -- Insert bookmark
  INSERT INTO bookmarks (user_id, url, title, tags)
  VALUES (v_user_id, p_url, COALESCE(p_title, ''), v_tags_array)
  RETURNING bookmarks.id INTO v_bookmark_id;
  
  -- Return result
  RETURN QUERY
  SELECT 
    v_bookmark_id,
    p_url,
    COALESCE(p_title, ''),
    v_tags_array;
END;
$$;