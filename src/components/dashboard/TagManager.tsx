import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tag, Plus, X, Edit2, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TagType {
  id: string;
  name: string;
  color: string | null;
}

interface TagManagerProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  availableTags?: string[];
}

const tagColors = [
  "#8B5CF6", // purple
  "#3B82F6", // blue
  "#10B981", // green
  "#F59E0B", // yellow
  "#EF4444", // red
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
];

export const TagManager = ({
  selectedTags,
  onTagsChange,
  availableTags = [],
}: TagManagerProps) => {
  const [tags, setTags] = useState<TagType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [selectedColor, setSelectedColor] = useState(tagColors[0]);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name");

      if (error) throw error;
      setTags(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch tags");
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      toast.error("Tag name is required");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from("tags").insert({
        user_id: user.id,
        name: newTagName.trim(),
        color: selectedColor,
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Tag already exists");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Tag created");
      setNewTagName("");
      setSelectedColor(tagColors[0]);
      fetchTags();
    } catch (error: any) {
      toast.error(error.message || "Failed to create tag");
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTag || !newTagName.trim()) return;

    try {
      const { error } = await supabase
        .from("tags")
        .update({
          name: newTagName.trim(),
          color: selectedColor,
        })
        .eq("id", editingTag.id);

      if (error) throw error;

      toast.success("Tag updated");
      setEditingTag(null);
      setNewTagName("");
      setSelectedColor(tagColors[0]);
      fetchTags();
    } catch (error: any) {
      toast.error(error.message || "Failed to update tag");
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from("tags")
        .delete()
        .eq("id", tagId);

      if (error) throw error;

      toast.success("Tag deleted");
      fetchTags();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tag");
    }
  };

  const toggleTag = (tagName: string) => {
    if (selectedTags.includes(tagName)) {
      onTagsChange(selectedTags.filter((t) => t !== tagName));
    } else {
      onTagsChange([...selectedTags, tagName]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="h-9">
            <Tag className="w-4 h-4 mr-2" />
            Tags
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? "Edit Tag" : "Manage Tags"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                {editingTag ? "Edit Tag Name" : "Create New Tag"}
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Tag name"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      editingTag ? handleUpdateTag() : handleCreateTag();
                    }
                  }}
                />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="icon" variant="outline">
                      <Palette className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3">
                    <div className="grid grid-cols-4 gap-2">
                      {tagColors.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-md border-2 ${
                            selectedColor === color
                              ? "border-foreground"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                <Button
                  onClick={editingTag ? handleUpdateTag : handleCreateTag}
                >
                  {editingTag ? "Update" : "Create"}
                </Button>
              </div>
              {editingTag && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingTag(null);
                    setNewTagName("");
                  }}
                >
                  Cancel Edit
                </Button>
              )}
            </div>

            <div className="border-t pt-4">
              <Label className="mb-2 block">Existing Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="gap-1 px-3 py-1"
                    style={{
                      backgroundColor: tag.color || undefined,
                      color: tag.color ? "#fff" : undefined,
                    }}
                  >
                    {tag.name}
                    <button
                      onClick={() => {
                        setEditingTag(tag);
                        setNewTagName(tag.name);
                        setSelectedColor(tag.color || tagColors[0]);
                      }}
                      className="hover:opacity-70"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteTag(tag.id)}
                      className="hover:opacity-70"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No tags yet. Create one above!
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {selectedTags.length > 0 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Filtering:</span>
          <div className="flex flex-wrap gap-1">
            {selectedTags.map((tagName) => {
              const tag = tags.find((t) => t.name === tagName);
              return (
                <Badge
                  key={tagName}
                  variant="default"
                  className="cursor-pointer h-7 px-2 text-xs"
                  style={{
                    backgroundColor: tag?.color || undefined,
                    color: tag?.color ? "#fff" : undefined,
                  }}
                  onClick={() => toggleTag(tagName)}
                >
                  {tagName}
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {availableTags.length > 0 && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 text-xs">
              {selectedTags.length > 0 
                ? `+ Add tags (${availableTags.length - selectedTags.length} more)` 
                : `Filter by tags (${availableTags.length})`}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">
                Click to {selectedTags.length > 0 ? 'add/remove' : 'select'} tags
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tagName) => {
                  const tag = tags.find((t) => t.name === tagName);
                  const isSelected = selectedTags.includes(tagName);
                  return (
                    <Badge
                      key={tagName}
                      variant={isSelected ? "default" : "outline"}
                      className="cursor-pointer transition-all"
                      style={
                        isSelected
                          ? {
                              backgroundColor: tag?.color || undefined,
                              color: tag?.color ? "#fff" : undefined,
                            }
                          : {
                              borderColor: tag?.color || undefined,
                              color: tag?.color || undefined,
                            }
                      }
                      onClick={() => toggleTag(tagName)}
                    >
                      {tagName}
                      {isSelected && <X className="w-3 h-3 ml-1" />}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};
