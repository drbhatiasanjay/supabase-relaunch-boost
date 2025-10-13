import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { BookmarkGrid } from "@/components/dashboard/BookmarkGrid";
import { BookmarkListView } from "@/components/dashboard/BookmarkListView";
import { BookmarkCompactView } from "@/components/dashboard/BookmarkCompactView";
import { AddBookmarkDialog } from "@/components/dashboard/AddBookmarkDialog";
import { ImportExportDialog } from "@/components/dashboard/ImportExportDialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

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
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "title" | "category">("date");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);

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

  const filteredBookmarks = bookmarks
    .filter(bookmark => {
      const matchesSearch = 
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFilter = selectedFilter === "all" || bookmark.reading;
      const matchesCategory = categoryFilter === "all" || bookmark.category === categoryFilter;

      return matchesSearch && matchesFilter && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "category") {
        return (a.category || "").localeCompare(b.category || "");
      }
      return 0;
    });

  const stats = {
    total: bookmarks.length,
    reading: bookmarks.filter(b => b.reading).length,
    tags: new Set(bookmarks.flatMap(b => b.tags)).size,
  };

  const categories = ["all", ...new Set(bookmarks.map(b => b.category).filter(Boolean))] as string[];

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
        onImportExportClick={() => setIsImportExportOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <DashboardStats
          total={stats.total}
          reading={stats.reading}
          tags={stats.tags}
          selectedFilter={selectedFilter}
          onFilterChange={setSelectedFilter}
        />

        {/* Filters and Sorting */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.filter(c => c !== "all").map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(val) => setSortBy(val as "date" | "title" | "category")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Sort by Date
                </div>
              </SelectItem>
              <SelectItem value="title">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Sort by Title
                </div>
              </SelectItem>
              <SelectItem value="category">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  Sort by Category
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="ml-auto text-sm text-muted-foreground flex items-center">
            {filteredBookmarks.length} bookmark{filteredBookmarks.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* View Modes */}
        {viewMode === "grid" && (
          <BookmarkGrid
            bookmarks={filteredBookmarks}
            loading={loading}
            onDelete={handleDeleteBookmark}
            onToggleReading={handleToggleReading}
            onRefresh={fetchBookmarks}
          />
        )}
        
        {viewMode === "list" && !loading && (
          <BookmarkListView
            bookmarks={filteredBookmarks}
            onDelete={handleDeleteBookmark}
            onToggleReading={handleToggleReading}
          />
        )}
        
        {viewMode === "compact" && !loading && (
          <BookmarkCompactView
            bookmarks={filteredBookmarks}
            onDelete={handleDeleteBookmark}
            onToggleReading={handleToggleReading}
          />
        )}

        {loading && viewMode !== "grid" && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        )}
      </main>

      <AddBookmarkDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchBookmarks}
      />

      <ImportExportDialog
        open={isImportExportOpen}
        onOpenChange={setIsImportExportOpen}
        bookmarks={bookmarks}
        onImportSuccess={fetchBookmarks}
      />
    </div>
  );
};

export default Dashboard;
