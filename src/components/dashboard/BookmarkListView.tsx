import { Bookmark } from "@/pages/Dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, MoreVertical, Trash2, BookMarked, Bookmark as BookmarkIcon, CheckCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BookmarkListViewProps {
  bookmarks: Bookmark[];
  onDelete: (id: string) => void;
  onToggleReading: (id: string, currentStatus: boolean) => void;
  onToggleRead: (id: string, currentStatus: boolean) => void;
}

export const BookmarkListView = ({
  bookmarks,
  onDelete,
  onToggleReading,
  onToggleRead,
}: BookmarkListViewProps) => {
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className="space-y-2">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="glass-card group hover:shadow-md transition-all duration-200 p-4"
        >
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-2">
                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/link flex-1"
                >
                  <h3 className="font-semibold text-base mb-1 group-hover/link:text-primary transition-colors">
                    {bookmark.title}
                  </h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    {getDomain(bookmark.url)}
                  </p>
                </a>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
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
                    {bookmark.reading && (
                      <DropdownMenuItem onClick={() => onToggleRead(bookmark.id, bookmark.read)}>
                        <CheckCheck className="w-4 h-4 mr-2" />
                        {bookmark.read ? "Mark as Unread" : "Mark as Read"}
                      </DropdownMenuItem>
                    )}
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

              {bookmark.description && (
                <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                  {bookmark.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2 items-center">
                {bookmark.reading && (
                  <Badge 
                    variant="secondary" 
                    className={`${bookmark.read ? 'bg-success/20 text-success border-success/30' : 'bg-secondary/20 text-secondary border-secondary/30'} text-xs`}
                  >
                    {bookmark.read ? (
                      <>
                        <CheckCheck className="w-3 h-3 mr-1" />
                        Read
                      </>
                    ) : (
                      <>
                        <BookMarked className="w-3 h-3 mr-1" />
                        Reading
                      </>
                    )}
                  </Badge>
                )}
                {bookmark.category && (
                  <Badge variant="outline" className="text-xs">
                    {bookmark.category}
                  </Badge>
                )}
                {bookmark.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {bookmark.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{bookmark.tags.length - 3}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
