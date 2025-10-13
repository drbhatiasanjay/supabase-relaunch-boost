import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Folder, FolderPlus, ChevronRight, ChevronDown, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FolderType {
  id: string;
  name: string;
  parent_id: string | null;
  children?: FolderType[];
}

interface FolderSidebarProps {
  selectedFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onRefresh: () => void;
  isOpen?: boolean;
}

export const FolderSidebar = ({
  selectedFolderId,
  onFolderSelect,
  onRefresh,
  isOpen = true,
}: FolderSidebarProps) => {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState("");
  const [parentFolderId, setParentFolderId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .order("name");

      if (error) throw error;

      const folderTree = buildFolderTree(data || []);
      setFolders(folderTree);
    } catch (error: any) {
      toast.error("Failed to fetch folders");
    }
  };

  const buildFolderTree = (flatFolders: any[]): FolderType[] => {
    const folderMap = new Map<string, FolderType>();
    const rootFolders: FolderType[] = [];

    flatFolders.forEach((folder) => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    flatFolders.forEach((folder) => {
      const folderNode = folderMap.get(folder.id)!;
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children!.push(folderNode);
        }
      } else {
        rootFolders.push(folderNode);
      }
    });

    return rootFolders;
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error("Folder name is required");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("folders").insert({
        user_id: user.id,
        name: newFolderName,
        parent_id: parentFolderId,
      });

      if (error) throw error;

      toast.success("Folder created");
      setNewFolderName("");
      setParentFolderId(null);
      setIsDialogOpen(false);
      fetchFolders();
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to create folder");
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;

    try {
      const { error } = await supabase
        .from("folders")
        .delete()
        .eq("id", folderToDelete);

      if (error) throw error;

      toast.success("Folder deleted");
      setDeleteDialogOpen(false);
      setFolderToDelete(null);
      if (selectedFolderId === folderToDelete) {
        onFolderSelect(null);
      }
      fetchFolders();
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete folder");
    }
  };

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const renderFolder = (folder: FolderType, depth = 0) => {
    const hasChildren = folder.children && folder.children.length > 0;
    const isExpanded = expandedFolders.has(folder.id);
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors group ${
            isSelected ? "bg-primary/10 text-primary" : ""
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-5" />}
          <Folder className="w-4 h-4" />
          <span
            className="flex-1 text-sm"
            onClick={() => onFolderSelect(folder.id)}
          >
            {folder.name}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setFolderToDelete(folder.id);
              setDeleteDialogOpen(true);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {folder.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`h-full border-r bg-card transition-all duration-300 overflow-hidden ${isOpen ? 'p-4 opacity-100' : 'p-0 opacity-0 w-0'} space-y-4`}>
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Folders</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <FolderPlus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Folder</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Folder Name</Label>
                <Input
                  placeholder="My Folder"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
              </div>
              <Button onClick={handleCreateFolder} className="w-full">
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div
        className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted transition-colors ${
          selectedFolderId === null ? "bg-primary/10 text-primary" : ""
        }`}
        onClick={() => onFolderSelect(null)}
      >
        <Folder className="w-4 h-4" />
        <span className="text-sm">All Bookmarks</span>
      </div>

      <div className="space-y-1">
        {folders.map((folder) => renderFolder(folder))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the folder and move all bookmarks in it to the root level. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFolder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
