import { Bookmark } from "@/pages/Dashboard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, MoreVertical, Trash2, BookMarked, Bookmark as BookmarkIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  onToggleReading: (id: string, currentStatus: boolean) => void;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

export const BookmarkCard = ({ 
  bookmark, 
  onDelete, 
  onToggleReading,
  isSelected,
  onToggleSelection
}: BookmarkCardProps) => {
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <Card className={`glass-card group hover:shadow-lg transition-all duration-300 overflow-hidden ${isSelected ? "ring-2 ring-primary" : ""}`}>
      <div className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          {onToggleSelection && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(bookmark.id)}
              className="mt-1"
            />
          )}
          <div className="flex-1 min-w-0">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group/link"
            >
              <h3 className="font-semibold text-lg mb-1 line-clamp-2 group-hover/link:text-primary transition-colors">
                {bookmark.title}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                {getDomain(bookmark.url)}
              </p>
            </a>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
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

        {bookmark.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {bookmark.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 items-center">
          {bookmark.reading && (
            <Badge variant="secondary" className="bg-secondary/20 text-secondary border-secondary/30">
              <BookMarked className="w-3 h-3 mr-1" />
              Reading List
            </Badge>
          )}
          {bookmark.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
          Added {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}
        </div>
      </div>
    </Card>
  );
};
