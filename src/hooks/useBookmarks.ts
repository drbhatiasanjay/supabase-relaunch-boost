import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bookmark } from "@/pages/Dashboard";

export const useBookmarks = (userId: string | undefined, selectedFolderId: string | null) => {
  const queryClient = useQueryClient();

  const bookmarksQuery = useQuery({
    queryKey: ["bookmarks", userId, selectedFolderId],
    queryFn: async () => {
      if (!userId) return [];
      
      const startTime = performance.now();
      
      // Optimized query: select only needed columns, use indexed columns
      let query = supabase
        .from("bookmarks")
        .select("id, title, url, description, tags, reading, read, category, folder_id, created_at, updated_at")
        .eq("user_id", userId);

      if (selectedFolderId) {
        query = query.eq("folder_id", selectedFolderId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      const duration = performance.now() - startTime;
      console.log(`✅ Bookmarks query completed in ${duration.toFixed(2)}ms`);

      if (error) throw error;
      return (data || []) as Bookmark[];
    },
    enabled: !!userId,
  });

  const deleteBookmark = useMutation({
    mutationFn: async (id: string) => {
      const startTime = performance.now();
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", id);
      
      const duration = performance.now() - startTime;
      console.log(`✅ Delete bookmark completed in ${duration.toFixed(2)}ms`);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success("Bookmark deleted", {
        description: "The bookmark has been removed from your collection.",
      });
    },
    onError: () => {
      toast.error("Failed to delete bookmark");
    },
  });

  const toggleReading = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: boolean }) => {
      const startTime = performance.now();
      const { error } = await supabase
        .from("bookmarks")
        .update({ reading: !currentStatus })
        .eq("id", id);

      const duration = performance.now() - startTime;
      console.log(`✅ Toggle reading completed in ${duration.toFixed(2)}ms`);

      if (error) throw error;
      return { id, newStatus: !currentStatus };
    },
    onMutate: async ({ id, currentStatus }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });
      const previousBookmarks = queryClient.getQueryData(["bookmarks", userId, selectedFolderId]);

      queryClient.setQueryData(["bookmarks", userId, selectedFolderId], (old: Bookmark[] | undefined) =>
        old?.map((b) => (b.id === id ? { ...b, reading: !currentStatus } : b))
      );

      return { previousBookmarks };
    },
    onSuccess: (_, { currentStatus }) => {
      toast.success(!currentStatus ? "Added to reading list" : "Removed from reading list");
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["bookmarks", userId, selectedFolderId], context?.previousBookmarks);
      toast.error("Failed to update bookmark");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const toggleRead = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: boolean }) => {
      const startTime = performance.now();
      const { error } = await supabase
        .from("bookmarks")
        .update({ read: !currentStatus })
        .eq("id", id);

      const duration = performance.now() - startTime;
      console.log(`✅ Toggle read completed in ${duration.toFixed(2)}ms`);

      if (error) throw error;
      return { id, newStatus: !currentStatus };
    },
    onMutate: async ({ id, currentStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });
      const previousBookmarks = queryClient.getQueryData(["bookmarks", userId, selectedFolderId]);

      queryClient.setQueryData(["bookmarks", userId, selectedFolderId], (old: Bookmark[] | undefined) =>
        old?.map((b) => (b.id === id ? { ...b, read: !currentStatus } : b))
      );

      return { previousBookmarks };
    },
    onSuccess: (_, { currentStatus }) => {
      toast.success(!currentStatus ? "Marked as read" : "Marked as unread");
    },
    onError: (_, __, context) => {
      queryClient.setQueryData(["bookmarks", userId, selectedFolderId], context?.previousBookmarks);
      toast.error("Failed to update bookmark");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      const startTime = performance.now();
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .in("id", ids);

      const duration = performance.now() - startTime;
      console.log(`✅ Bulk delete completed in ${duration.toFixed(2)}ms for ${ids.length} bookmarks`);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success(`Deleted ${count} bookmark${count > 1 ? "s" : ""}`);
    },
    onError: () => {
      toast.error("Failed to delete bookmarks");
    },
  });

  const bulkMoveToFolder = useMutation({
    mutationFn: async ({ ids, folderId }: { ids: string[]; folderId: string }) => {
      const startTime = performance.now();
      const { error } = await supabase
        .from("bookmarks")
        .update({ folder_id: folderId === "null" ? null : folderId })
        .in("id", ids);

      const duration = performance.now() - startTime;
      console.log(`✅ Bulk move completed in ${duration.toFixed(2)}ms for ${ids.length} bookmarks`);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success(`Moved ${count} bookmark${count > 1 ? "s" : ""}`);
    },
    onError: () => {
      toast.error("Failed to move bookmarks");
    },
  });

  const updateBookmark = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Bookmark> }) => {
      const startTime = performance.now();
      const { error } = await supabase
        .from("bookmarks")
        .update(data)
        .eq("id", id);

      const duration = performance.now() - startTime;
      console.log(`✅ Update bookmark completed in ${duration.toFixed(2)}ms`);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      toast.success("Bookmark updated successfully");
    },
    onError: () => {
      toast.error("Failed to update bookmark");
    },
  });

  return {
    bookmarks: bookmarksQuery.data || [],
    isLoading: bookmarksQuery.isLoading,
    deleteBookmark,
    toggleReading,
    toggleRead,
    bulkDelete,
    bulkMoveToFolder,
    updateBookmark,
    refetch: bookmarksQuery.refetch,
  };
};
