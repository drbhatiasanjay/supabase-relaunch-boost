import { Bookmark } from "@/pages/Dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, MoreVertical, Trash2, BookMarked, Bookmark as BookmarkIcon } from "lucide-react";

interface BookmarkCompactViewProps {
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
  onToggleReading: (id: string, currentStatus: boolean) => void;
}

export const BookmarkCompactView = ({
  bookmarks,
  onDelete,
  onToggleReading,
}: BookmarkCompactViewProps) => {
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="glass-card divide-y divide-border/50">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="group hover:bg-muted/30 transition-colors px-4 py-3"
        >
          <div className="flex items-center gap-3">
            {bookmark.reading && (
              <BookMarked className="w-4 h-4 text-secondary flex-shrink-0" />
            )}
            
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 group/link"
            >
              <div className="flex items-baseline gap-2">
                <span className="font-medium text-sm group-hover/link:text-primary transition-colors truncate">
                  {bookmark.title}
                </span>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {getDomain(bookmark.url)}
                </span>
              </div>
            </a>

            <div className="flex items-center gap-2 flex-shrink-0">
              {bookmark.category && (
                <Badge variant="outline" className="text-xs">
                  {bookmark.category}
                </Badge>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onToggleReading(bookmark.id, bookmark.reading)}>
                    {bookmark.reading ? (
                      <>
                        <BookmarkIcon className="w-4 h-4 mr-2" />
                        Remove from Reading List
                      </>
                    ) : (
                      <>
                        <BookMarked className="w-4 h-4 mr-2" />
                        Add to Reading List
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(bookmark.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
