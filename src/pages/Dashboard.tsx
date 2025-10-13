import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { BookmarkGrid } from "@/components/dashboard/BookmarkGrid";
import { BookmarkListView } from "@/components/dashboard/BookmarkListView";
import { BookmarkCompactView } from "@/components/dashboard/BookmarkCompactView";
import { AddBookmarkDialog } from "@/components/dashboard/AddBookmarkDialog";
import { ImportExportDialog } from "@/components/dashboard/ImportExportDialog";
import { FolderSidebar } from "@/components/dashboard/FolderSidebar";
import { BulkActionsBar } from "@/components/dashboard/BulkActionsBar";
import { TagManager } from "@/components/dashboard/TagManager";
import { BookmarkletGuide } from "@/components/dashboard/BookmarkletGuide";
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
  folder_id?: string | null;
  created_at: string;
  updated_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [prefillData, setPrefillData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
      fetchFolders();
    }
  }, [user, selectedFolderId]);

  useEffect(() => {
    // Handle bookmarklet prefill
    const add = searchParams.get("add");
    const url = searchParams.get("url");
    const title = searchParams.get("title");
    const description = searchParams.get("description");
    
    if (add === "true" && url) {
      setPrefillData({ url, title: title || "", description: description || "" });
      setIsAddDialogOpen(true);
    }
  }, [searchParams]);

  const fetchBookmarks = async () => {
    try {
      let query = supabase
        .from("bookmarks")
        .select("*");

      if (selectedFolderId) {
        query = query.eq("folder_id", selectedFolderId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch bookmarks");
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from("folders")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setFolders(data || []);
    } catch (error: any) {
      console.error("Failed to fetch folders");
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

  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selectedBookmarks);
      const { error } = await supabase
        .from("bookmarks")
        .delete()
        .in("id", ids);

      if (error) throw error;

      setBookmarks(bookmarks.filter(b => !selectedBookmarks.has(b.id)));
      setSelectedBookmarks(new Set());
      toast.success(`Deleted ${ids.length} bookmark${ids.length > 1 ? "s" : ""}`);
    } catch (error: any) {
      toast.error("Failed to delete bookmarks");
    }
  };

  const handleBulkMoveToFolder = async (folderId: string) => {
    try {
      const ids = Array.from(selectedBookmarks);
      const { error } = await supabase
        .from("bookmarks")
        .update({ folder_id: folderId === "null" ? null : folderId })
        .in("id", ids);

      if (error) throw error;

      toast.success(`Moved ${ids.length} bookmark${ids.length > 1 ? "s" : ""}`);
      setSelectedBookmarks(new Set());
      fetchBookmarks();
    } catch (error: any) {
      toast.error("Failed to move bookmarks");
    }
  };

  const toggleBookmarkSelection = (id: string) => {
    const newSelection = new Set(selectedBookmarks);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedBookmarks(newSelection);
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
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => bookmark.tags.includes(tag));

      return matchesSearch && matchesFilter && matchesCategory && matchesTags;
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
  const allTags = Array.from(new Set(bookmarks.flatMap(b => b.tags)));

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
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
      />

      <div className="flex">
        <div className={`transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-0'}`}>
          <FolderSidebar
            selectedFolderId={selectedFolderId}
            onFolderSelect={setSelectedFolderId}
            onRefresh={fetchBookmarks}
            isOpen={isSidebarOpen}
          />
        </div>

        <main className={`flex-1 px-4 py-8 mx-auto w-full transition-all duration-300 ${isSidebarOpen ? 'max-w-6xl' : 'max-w-7xl'}`}>
          <DashboardStats
            total={stats.total}
            reading={stats.reading}
            tags={stats.tags}
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
          />

          {/* Filters and Tag Management Row */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
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
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    By Date
                  </div>
                </SelectItem>
                <SelectItem value="title">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    By Title
                  </div>
                </SelectItem>
                <SelectItem value="category">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    By Category
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <TagManager
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              availableTags={allTags}
            />

            <BookmarkletGuide />

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
              selectedBookmarks={selectedBookmarks}
              onToggleSelection={toggleBookmarkSelection}
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
      </div>

      <BulkActionsBar
        selectedCount={selectedBookmarks.size}
        onClearSelection={() => setSelectedBookmarks(new Set())}
        onBulkDelete={handleBulkDelete}
        onBulkMoveToFolder={handleBulkMoveToFolder}
        onBulkAddTags={() => {}}
        folders={folders}
        availableTags={allTags}
      />

      <AddBookmarkDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchBookmarks}
        prefillData={prefillData}
        folderId={selectedFolderId}
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
