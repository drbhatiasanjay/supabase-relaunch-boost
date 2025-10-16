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
import { ExternalLink, MoreVertical, Trash2, BookMarked, Bookmark as BookmarkIcon, Clock, CheckCheck, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface BookmarkCardProps {
  bookmark: Bookmark;
  onDelete: (id: string) => void;
  onToggleReading: (id: string, currentStatus: boolean) => void;
  onToggleRead: (id: string, currentStatus: boolean) => void;
  onEdit: (bookmark: Bookmark) => void;
  isSelected?: boolean;
  onToggleSelection?: (id: string) => void;
}

export const BookmarkCard = ({ 
  bookmark, 
  onDelete, 
  onToggleReading,
  onToggleRead,
  onEdit,
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
    <Card className={`glass-card group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden ${isSelected ? "ring-2 ring-primary scale-[1.02]" : ""} cursor-pointer hover:scale-[1.02]`}>
      <div className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          {onToggleSelection && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onToggleSelection(bookmark.id)}
              className="mt-0.5 flex-shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group/link"
            >
              <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover/link:text-primary transition-colors">
                {bookmark.title}
              </h3>
            </a>
            
            {/* Domain and timestamp in same line */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1 flex-shrink-0">
                <ExternalLink className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{getDomain(bookmark.url)}</span>
              </div>
              <span className="text-muted-foreground/60">•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span className="whitespace-nowrap">{formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(bookmark)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
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
          <p className="text-xs text-muted-foreground line-clamp-2 pl-5">
            {bookmark.description}
          </p>
        )}

        {/* Tags and reading badge in one compact row */}
        {(bookmark.reading || bookmark.tags.length > 0) && (
          <div className="flex flex-wrap gap-1.5 items-center pl-5">
            {bookmark.reading && (
              <Badge 
                variant="secondary" 
                className={`${bookmark.read ? 'bg-success/20 text-success border-success/30' : 'bg-secondary/20 text-secondary border-secondary/30'} h-5 text-xs px-1.5`}
              >
                {bookmark.read ? (
                  <>
                    <CheckCheck className="w-3 h-3 mr-0.5" />
                    Read
                  </>
                ) : (
                  <>
                    <BookMarked className="w-3 h-3 mr-0.5" />
                    Reading
                  </>
                )}
              </Badge>
            )}
            {bookmark.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs h-5 px-1.5">
                {tag}
              </Badge>
            ))}
            {bookmark.tags.length > 3 && (
              <Badge variant="outline" className="text-xs h-5 px-1.5">
                +{bookmark.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
