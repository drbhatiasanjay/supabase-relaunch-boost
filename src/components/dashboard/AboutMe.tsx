import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";


interface PersonalityAnalysis {
  interests: string[];
  topics: string[];
  readingPatterns: string;
  personalityTraits: string[];
}

export const AboutMe = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PersonalityAnalysis | null>(null);

  const handleAnalyzeClick = async () => {
    setIsDialogOpen(true);
    
    // If we already have cached analysis, just show it
    if (analysis) {
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-personality');

      if (error) throw error;

      setAnalysis(data);
    } catch (error) {
      console.error('Error analyzing personality:', error);
      toast.error('Failed to analyze personality. Please try again.');
      setIsDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card 
        className="glass-card p-2.5 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-glow group ring-2 ring-primary/40 hover:ring-primary/60"
        onClick={handleAnalyzeClick}
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg w-fit bg-gradient-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)] group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.7)] transition-all duration-200">
              <Sparkles 
                className="w-4 h-4 text-white animate-pulse" 
                style={{ 
                  filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'
                }}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground font-bold leading-tight">About Me</p>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-primary" />
              Your Personality Insights
            </DialogTitle>
            <DialogDescription>
              AI-powered analysis based on your bookmark collection
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing your bookmarks...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-4 py-3">
              {/* Personality Traits - First */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  ✨ Personality Traits
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.personalityTraits.map((trait, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm border border-accent/20"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              {/* Reading Patterns - Second */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  📖 Reading Patterns
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg">
                  {analysis.readingPatterns}
                </p>
              </div>

              {/* Main Interests - Third (top 3) */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  🎯 Main Interests
                </h3>
                <div className="pl-4 border-l-2 border-primary/30 space-y-2">
                  {analysis.interests.slice(0, 3).map((interest, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-px bg-primary/30" />
                      <span className="text-sm text-primary font-medium bg-primary/5 px-3 py-1.5 rounded-md border border-primary/20">
                        {interest}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Topics - Fourth (top 3) */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  📚 Key Topics
                </h3>
                <div className="pl-4 border-l-2 border-secondary/30 space-y-2">
                  {analysis.topics.slice(0, 3).map((topic, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-px bg-secondary/30" />
                      <span className="text-sm text-secondary font-medium bg-secondary/5 px-3 py-1.5 rounded-md border border-secondary/20">
                        {topic}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};
