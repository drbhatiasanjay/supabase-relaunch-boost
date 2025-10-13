import { useState } from "react";
import { Upload, Download, FileJson, Globe } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { parseBookmarkHTML, exportToHTML, exportToJSON, downloadFile } from "@/lib/bookmarkParser";
import { supabase } from "@/integrations/supabase/client";
import { Bookmark } from "@/pages/Dashboard";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmarks: Bookmark[];
  onImportSuccess: () => void;
}

export const ImportExportDialog = ({
  open,
  onOpenChange,
  bookmarks,
  onImportSuccess,
}: ImportExportDialogProps) => {
  const [importing, setImporting] = useState(false);

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const parsed = parseBookmarkHTML(text);

      if (parsed.length === 0) {
        toast.error("No bookmarks found in file");
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Not authenticated");
        return;
      }

      // Insert bookmarks
      const { error } = await supabase.from("bookmarks").insert(
        parsed.map(b => ({
          user_id: user.id,
          title: b.title,
          url: b.url,
          description: b.description,
          tags: b.tags,
          category: b.category,
          reading: false,
        }))
      );

      if (error) throw error;

      toast.success(`Successfully imported ${parsed.length} bookmarks`);
      onImportSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to import bookmarks: " + error.message);
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const handleExportHTML = () => {
    const html = exportToHTML(bookmarks.map(b => ({
      title: b.title,
      url: b.url,
      description: b.description,
      tags: b.tags,
      category: b.category,
    })));
    
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(html, `bookmarks-${timestamp}.html`, 'text/html');
    toast.success("Bookmarks exported as HTML");
  };

  const handleExportJSON = () => {
    const json = exportToJSON(bookmarks);
    const timestamp = new Date().toISOString().split('T')[0];
    downloadFile(json, `bookmarks-${timestamp}.json`, 'application/json');
    toast.success("Bookmarks exported as JSON");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import & Export</DialogTitle>
          <DialogDescription>
            Import bookmarks from your browser or export your collection
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bookmark-file">Choose bookmark file</Label>
              <div className="flex flex-col gap-2">
                <input
                  id="bookmark-file"
                  type="file"
                  accept=".html,.htm"
                  onChange={handleImport}
                  disabled={importing}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary file:text-primary-foreground
                    hover:file:opacity-90 file:cursor-pointer
                    cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Supports Chrome & Firefox bookmark HTML files
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border/50 p-4 bg-muted/20">
              <h4 className="font-medium mb-2 text-sm">How to export from browsers:</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li><strong>Chrome:</strong> ☰ → Bookmarks → Bookmark manager → ⋮ → Export bookmarks</li>
                <li><strong>Firefox:</strong> ☰ → Bookmarks → Manage bookmarks → Import and Backup → Export</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={handleExportHTML}
                className="w-full justify-start"
                variant="outline"
              >
                <Globe className="w-4 h-4 mr-2" />
                Export as HTML
                <span className="ml-auto text-xs text-muted-foreground">
                  Chrome/Firefox compatible
                </span>
              </Button>

              <Button
                onClick={handleExportJSON}
                className="w-full justify-start"
                variant="outline"
              >
                <FileJson className="w-4 h-4 mr-2" />
                Export as JSON
                <span className="ml-auto text-xs text-muted-foreground">
                  Backup format
                </span>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''} will be exported
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
