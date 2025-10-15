import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useFolders } from "@/hooks/useFolders";
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
import { AboutMe } from "@/components/dashboard/AboutMe";

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
  const [prefillData, setPrefillData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Use optimized hooks with React Query caching
  const { bookmarks, isLoading, deleteBookmark, toggleReading, bulkDelete, bulkMoveToFolder, refetch } = 
    useBookmarks(user?.id, selectedFolderId);
  const { data: folders = [] } = useFolders(user?.id);

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
    deleteBookmark.mutate(id);
  };

  const handleToggleReading = async (id: string, currentStatus: boolean) => {
    toggleReading.mutate({ id, currentStatus });
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedBookmarks);
    bulkDelete.mutate(ids);
    setSelectedBookmarks(new Set());
  };

  const handleBulkMoveToFolder = async (folderId: string) => {
    const ids = Array.from(selectedBookmarks);
    bulkMoveToFolder.mutate({ ids, folderId });
    setSelectedBookmarks(new Set());
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

  // Memoize expensive computations
  const filteredBookmarks = useMemo(() => bookmarks
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
    }), [bookmarks, searchQuery, selectedFilter, categoryFilter, selectedTags, sortBy]);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const stats = useMemo(() => ({
    total: bookmarks.length,
    reading: bookmarks.filter(b => b.reading).length,
    tags: new Set(bookmarks.flatMap(b => b.tags)).size,
    categories: new Set(bookmarks.map(b => b.category).filter(Boolean)).size,
    thisWeek: bookmarks.filter(b => new Date(b.created_at) >= weekAgo).length,
  }), [bookmarks]);

  const categories = useMemo(() => 
    ["all", ...new Set(bookmarks.map(b => b.category).filter(Boolean))] as string[], 
    [bookmarks]
  );
  
  const allTags = useMemo(() => 
    Array.from(new Set(bookmarks.flatMap(b => b.tags))),
    [bookmarks]
  );

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
            onRefresh={refetch}
            isOpen={isSidebarOpen}
          />
        </div>

        <main className={`flex-1 px-4 sm:px-6 lg:px-8 py-6 mx-auto w-full transition-all duration-300 ${isSidebarOpen ? 'max-w-[1800px]' : 'max-w-[1800px]'}`}>
          <div className="grid grid-cols-5 gap-3 mb-4">
            <div className="col-span-4">
              <DashboardStats
                total={stats.total}
                reading={stats.reading}
                tags={stats.tags}
                categories={stats.categories}
                thisWeek={stats.thisWeek}
                selectedFilter={selectedFilter}
                onFilterChange={setSelectedFilter}
              />
            </div>
            <div className="flex items-center justify-center">
              <AboutMe />
            </div>
          </div>

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
              loading={isLoading}
              onDelete={handleDeleteBookmark}
              onToggleReading={handleToggleReading}
              onRefresh={refetch}
              selectedBookmarks={selectedBookmarks}
              onToggleSelection={toggleBookmarkSelection}
            />
          )}
          
          {viewMode === "list" && !isLoading && (
            <BookmarkListView
              bookmarks={filteredBookmarks}
              onDelete={handleDeleteBookmark}
              onToggleReading={handleToggleReading}
            />
          )}
          
          {viewMode === "compact" && !isLoading && (
            <BookmarkCompactView
              bookmarks={filteredBookmarks}
              onDelete={handleDeleteBookmark}
              onToggleReading={handleToggleReading}
            />
          )}

          {isLoading && viewMode !== "grid" && (
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
        onSuccess={refetch}
        prefillData={prefillData}
        folderId={selectedFolderId}
      />

      <ImportExportDialog
        open={isImportExportOpen}
        onOpenChange={setIsImportExportOpen}
        bookmarks={bookmarks}
        onImportSuccess={refetch}
      />
    </div>
  );
};

export default Dashboard;
