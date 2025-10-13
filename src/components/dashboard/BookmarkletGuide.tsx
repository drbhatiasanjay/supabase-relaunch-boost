import { Bookmark, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const BookmarkletGuide = () => {
  const [copied, setCopied] = useState(false);

  const bookmarkletCode = `javascript:(function(){var t=document.title,u=window.location.href,d=window.getSelection().toString().substring(0,500);window.open('${window.location.origin}/dashboard?add=true&url='+encodeURIComponent(u)+'&title='+encodeURIComponent(t)+'&description='+encodeURIComponent(d),'_blank')})();`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    toast.success("Bookmarklet code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Bookmark className="w-4 h-4 mr-2" />
          Quick Save
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Quick Save Bookmarklet</DialogTitle>
          <DialogDescription>
            Add a quick save button to your browser toolbar to bookmark any page instantly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">How to Install:</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Show your browser's bookmarks bar (Ctrl/Cmd + Shift + B)</li>
              <li>Copy the code below</li>
              <li>Create a new bookmark in your browser</li>
              <li>Name it "Quick Save to Bookmarks"</li>
              <li>Paste the code as the URL/Location</li>
              <li>Save the bookmark</li>
            </ol>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Bookmarklet Code:</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>
            <div className="p-3 bg-muted rounded-md font-mono text-xs break-all">
              {bookmarkletCode}
            </div>
          </div>

          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-2">How to Use:</h4>
            <p className="text-sm text-muted-foreground">
              While browsing any website, click the "Quick Save to Bookmarks" button in your
              bookmarks bar. This will open a new tab with the bookmark dialog pre-filled
              with the current page's title, URL, and any selected text as description.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
