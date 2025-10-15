import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const bookmarkSchema = z.object({
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Invalid URL format"),
  description: z.string().optional(),
});

interface AddBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  prefillData?: {
    url?: string;
    title?: string;
    description?: string;
  };
  folderId?: string | null;
}

export const AddBookmarkDialog = ({ 
  open, 
  onOpenChange, 
  onSuccess, 
  prefillData,
  folderId 
}: AddBookmarkDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [reading, setReading] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [autoFetch, setAutoFetch] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      if (prefillData) {
        setUrl(prefillData.url || "");
        setTitle(prefillData.title || "");
        setDescription(prefillData.description || "");
      } else {
        resetForm();
      }
      fetchAvailableTags();
    }
  }, [open, prefillData]);

  const fetchAvailableTags = async () => {
    try {
      const { data: bookmarks } = await supabase
        .from("bookmarks")
        .select("tags");
      
      const allTags = new Set<string>();
      bookmarks?.forEach(b => {
        b.tags?.forEach((tag: string) => allTags.add(tag));
      });
      
      setAvailableTags(Array.from(allTags));
    } catch (error) {
      console.error("Failed to fetch tags");
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const fetchMetadata = async (urlToFetch: string) => {
    if (!urlToFetch || fetching) return;
    
    setFetching(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-bookmark-metadata', {
        body: { url: urlToFetch }
      });

      if (error) {
        toast.error("Could not fetch metadata", {
          description: "Please enter details manually."
        });
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.title) setTitle(data.title);
      if (data?.description) setDescription(data.description);
      if (data?.tags && Array.isArray(data.tags)) {
        setTags(data.tags.filter((tag: string) => tag && tag.trim()));
      }
      
      toast.success("Metadata fetched successfully!");
    } catch (err) {
      console.error("Fetch metadata error:", err);
      toast.error("Failed to fetch metadata", {
        description: "Please enter details manually."
      });
    } finally {
      setFetching(false);
    }
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    
    // Auto-fetch if enabled and URL looks valid
    if (autoFetch && newUrl.match(/^https?:\/\/.+/)) {
      // Debounce: wait a bit before fetching
      const timer = setTimeout(() => {
        fetchMetadata(newUrl);
      }, 800);
      return () => clearTimeout(timer);
    }
  };

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setDescription("");
    setReading(false);
    setTags([]);
    setTagInput("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validated = bookmarkSchema.parse({ title, url, description });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("bookmarks").insert({
        user_id: user.id,
        title: validated.title,
        url: validated.url,
        description: validated.description || null,
        tags,
        reading,
        folder_id: folderId,
      });

      if (error) throw error;

      toast.success("Bookmark saved!", {
        description: "Your bookmark has been added to your collection.",
      });

      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Failed to save bookmark");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:max-w-[520px] max-h-[85vh] p-4 md:p-5">
        <DialogHeader>
          <DialogTitle>Add New Bookmark</DialogTitle>
          <DialogDescription>
            Save a link to your collection. Add tags to organize better.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] overflow-y-auto pr-1">
          <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 border">
            <div>
              <Label htmlFor="auto-fetch" className="text-sm font-medium cursor-pointer">
                Auto-fetch metadata
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically extract title and description from URL
              </p>
            </div>
            <Switch
              id="auto-fetch"
              checked={autoFetch}
              onCheckedChange={setAutoFetch}
              disabled={loading || fetching}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              required
              disabled={loading || fetching}
              className="h-9"
            />
            {fetching && (
              <p className="text-xs text-muted-foreground">Fetching metadata...</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Bookmark title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                disabled={loading}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="Type and press Enter"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                disabled={loading}
                list="tag-suggestions"
                className="h-9"
              />
              <datalist id="tag-suggestions">
                {availableTags.map((tag) => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={2}
              maxLength={500}
              className="resize-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="reading"
              checked={reading}
              onCheckedChange={(checked) => setReading(checked === true)}
              disabled={loading}
            />
            <Label htmlFor="reading" className="text-sm cursor-pointer">
              Add to Reading List
            </Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="flex-1 h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || fetching}
              className="flex-1 h-9 bg-gradient-primary hover:opacity-90 transition-opacity"
            >
              {loading ? "Saving..." : fetching ? "Fetching..." : "Save Bookmark"}
            </Button>
          </div>
        </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
