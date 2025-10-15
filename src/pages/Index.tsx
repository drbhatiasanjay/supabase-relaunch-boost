import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bookmark, Sparkles, BookMarked, Tag, Search, Brain, Link as LinkIcon, MessageCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-hero opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--primary-glow)),transparent_60%)]" />
      
      <nav className="relative z-10 container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary blur-lg opacity-50" />
            <div className="relative bg-gradient-primary p-2 rounded-xl">
              <Bookmark className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold gradient-text">BookmarkHub</h1>
        </div>
        <Button
          onClick={() => navigate("/auth")}
          variant="outline"
          className="border-primary/30 hover:bg-primary/10"
        >
          Sign In
        </Button>
      </nav>

      <main className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              Save Your Links,
              <br />
              <span className="gradient-text">Find Them Instantly</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A modern bookmarks manager that helps you organize, search, and never lose track of your favorite content.
            </p>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate("/auth")}
                size="lg"
                className="bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
            </div>
            <Button variant="link" onClick={() => navigate("/auth")} className="text-primary">
              Find out more about yourself
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
                <BookMarked className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Reading List</h3>
              <p className="text-sm text-muted-foreground">
                Mark bookmarks for later and keep your reading queue organized
              </p>
            </div>

            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <Tag className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Smart Tags</h3>
              <p className="text-sm text-muted-foreground">
                Organize with tags and find bookmarks with intelligent filtering
              </p>
            </div>

            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-warning to-primary flex items-center justify-center">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Instant Search</h3>
              <p className="text-sm text-muted-foreground">
                Find any bookmark in seconds with powerful full-text search
              </p>
            </div>

            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold">AI Personality</h3>
              <p className="text-sm text-muted-foreground">
                Discover insights about your interests and reading patterns
              </p>
            </div>

            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-accent to-primary flex items-center justify-center">
                <LinkIcon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Auto Fetch URL</h3>
              <p className="text-sm text-muted-foreground">
                Paste a link and we’ll fetch titles, descriptions, and icons
              </p>
            </div>

            <div className="glass-card p-6 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold">Telegram Bot</h3>
              <p className="text-sm text-muted-foreground">
                Save and search bookmarks directly from Telegram
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
