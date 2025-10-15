-- Enable realtime for bookmarks table
ALTER TABLE bookmarks REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;