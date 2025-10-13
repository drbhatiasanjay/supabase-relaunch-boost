import { Trash2, FolderOpen, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkMoveToFolder: (folderId: string) => void;
  onBulkAddTags: (tags: string[]) => void;
  folders: { id: string; name: string }[];
  availableTags: string[];
}

export const BulkActionsBar = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkMoveToFolder,
  folders,
}: BulkActionsBarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-card border shadow-lg rounded-lg p-4 z-50 animate-fade-in">
      <div className="flex items-center gap-4">
        <Badge variant="secondary" className="text-sm">
          {selectedCount} selected
        </Badge>

        <div className="h-6 w-px bg-border" />

        <Select onValueChange={onBulkMoveToFolder}>
          <SelectTrigger className="w-[180px] h-9">
            <FolderOpen className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Move to folder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="null">No folder</SelectItem>
            {folders.map((folder) => (
              <SelectItem key={folder.id} value={folder.id}>
                {folder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          size="sm"
          variant="destructive"
          onClick={onBulkDelete}
          className="h-9"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </Button>

        <div className="h-6 w-px bg-border" />

        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          className="h-9"
        >
          <X className="w-4 h-4 mr-2" />
          Clear
        </Button>
      </div>
    </div>
  );
};
