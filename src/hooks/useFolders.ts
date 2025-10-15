import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFolders = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["folders", userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const startTime = performance.now();
      
      const { data, error } = await supabase
        .from("folders")
        .select("id, name")
        .eq("user_id", userId)
        .order("name");

      const duration = performance.now() - startTime;
      console.log(`✅ Folders query completed in ${duration.toFixed(2)}ms`);

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });
};
