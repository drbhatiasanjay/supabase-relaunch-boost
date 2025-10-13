import { Bookmark } from "@/pages/Dashboard";
import { BookmarkCard } from "./BookmarkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BookMarked } from "lucide-react";

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  loading: boolean;
  onDelete: (id: string) => void;
  onToggleReading: (id: string, currentStatus: boolean) => void;
  onRefresh: () => void;
  selectedBookmarks?: Set<string>;
  onToggleSelection?: (id: string) => void;
}

export const BookmarkGrid = ({
  bookmarks,
  loading,
  onDelete,
  onToggleReading,
  onRefresh,
  selectedBookmarks,
  onToggleSelection,
}: BookmarkGridProps) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="glass-card p-6 space-y-4">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-primary blur-2xl opacity-20" />
          <div className="relative bg-gradient-primary/10 p-8 rounded-full">
            <BookMarked className="w-16 h-16 text-primary" />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-2">No bookmarks found</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Start building your collection by adding your first bookmark. Save links you want to read later!
        </p>
      </div>
    );
  }

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            onDelete={onDelete}
            onToggleReading={onToggleReading}
            isSelected={selectedBookmarks?.has(bookmark.id)}
            onToggleSelection={onToggleSelection}
          />
        ))}
      </div>
  );
};
