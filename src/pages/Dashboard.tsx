import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { BookmarkGrid } from "@/components/dashboard/BookmarkGrid";
import { AddBookmarkDialog } from "@/components/dashboard/AddBookmarkDialog";
import { toast } from "sonner";

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  description?: string;
  tags: string[];
  reading: boolean;
  category?: string;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "reading">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    try {
      const { data, error } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch bookmarks");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Failed to sign out");
    }
  };

  const handleDeleteBookmark = async (id: string) => {
    try {
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setBookmarks(bookmarks.filter(b => b.id !== id));
      toast.success("Bookmark deleted", {
        description: "The bookmark has been removed from your collection.",
      });
    } catch (error: any) {
      toast.error("Failed to delete bookmark");
    }
  };

  const handleToggleReading = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("bookmarks")
        .update({ reading: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setBookmarks(bookmarks.map(b => 
        b.id === id ? { ...b, reading: !currentStatus } : b
      ));

      toast.success(
        !currentStatus ? "Added to reading list" : "Removed from reading list"
      );
    } catch (error: any) {
      toast.error("Failed to update bookmark");
    }
  };

  const filteredBookmarks = bookmarks.filter(bookmark => {
    const matchesSearch = 
      bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFilter = selectedFilter === "all" || bookmark.reading;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: bookmarks.length,
    reading: bookmarks.filter(b => b.reading).length,
    tags: new Set(bookmarks.flatMap(b => b.tags)).size,
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        userEmail={user.email || ""}
        onSignOut={handleSignOut}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onAddClick={() => setIsAddDialogOpen(true)}
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <DashboardStats
          total={stats.total}
          reading={stats.reading}
          tags={stats.tags}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />

        <BookmarkGrid
          bookmarks={filteredBookmarks}
          loading={loading}
          onDelete={handleDeleteBookmark}
          onToggleReading={handleToggleReading}
          onRefresh={fetchBookmarks}
        />
      </main>

      <AddBookmarkDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchBookmarks}
      />
    </div>
  );
};

export default Dashboard;
