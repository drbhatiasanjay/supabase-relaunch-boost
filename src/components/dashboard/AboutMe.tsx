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

              {/* Knowledge Graph - Interests and Topics Connected */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  🧠 Knowledge Graph
                </h3>
                <div className="relative bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent p-6 rounded-lg border border-primary/10 min-h-[200px]">
                  {/* SVG for connection lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    {/* Lines connecting interests to topics */}
                    {analysis.interests.slice(0, 3).map((_, interestIdx) =>
                      analysis.topics.slice(0, 3).map((_, topicIdx) => {
                        const startX = 30 + (interestIdx * 120);
                        const startY = 40;
                        const endX = 30 + (topicIdx * 120);
                        const endY = 140;
                        return (
                          <line
                            key={`${interestIdx}-${topicIdx}`}
                            x1={startX}
                            y1={startY}
                            x2={endX}
                            y2={endY}
                            stroke="hsl(var(--primary) / 0.2)"
                            strokeWidth="1"
                            strokeDasharray="2,2"
                          />
                        );
                      })
                    )}
                  </svg>

                  {/* Interest Nodes (Top Row) */}
                  <div className="relative flex justify-around mb-16" style={{ zIndex: 1 }}>
                    {analysis.interests.slice(0, 3).map((interest, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className="relative group">
                          <div className="absolute inset-0 bg-primary/30 blur-md rounded-full group-hover:bg-primary/40 transition-all" />
                          <div className="relative w-16 h-16 rounded-full bg-gradient-primary border-2 border-primary flex items-center justify-center shadow-lg">
                            <span className="text-xl">🎯</span>
                          </div>
                        </div>
                        <span className="mt-2 text-xs text-primary font-medium text-center max-w-[100px] line-clamp-2">
                          {interest}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Topic Nodes (Bottom Row) */}
                  <div className="relative flex justify-around" style={{ zIndex: 1 }}>
                    {analysis.topics.slice(0, 3).map((topic, idx) => (
                      <div key={idx} className="flex flex-col items-center">
                        <div className="relative group">
                          <div className="absolute inset-0 bg-secondary/30 blur-md rounded-full group-hover:bg-secondary/40 transition-all" />
                          <div className="relative w-16 h-16 rounded-full bg-secondary border-2 border-secondary/50 flex items-center justify-center shadow-lg">
                            <span className="text-xl">📚</span>
                          </div>
                        </div>
                        <span className="mt-2 text-xs text-secondary font-medium text-center max-w-[100px] line-clamp-2">
                          {topic}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};
