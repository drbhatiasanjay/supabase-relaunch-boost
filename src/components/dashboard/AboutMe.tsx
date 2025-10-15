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
              {/* Two Column Layout: Personality Traits and Reading Patterns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personality Traits - Left Column */}
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

                {/* Reading Patterns - Right Column */}
                <div className="space-y-2">
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    📖 Reading Patterns
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg">
                    {analysis.readingPatterns}
                  </p>
                </div>
              </div>

              {/* Neo4J-Style Knowledge Graph - Below */}
              <div className="space-y-2">
                <h3 className="text-base font-semibold flex items-center gap-2">
                  🧠 Knowledge Graph
                </h3>
                <div className="relative bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent p-8 rounded-lg border border-primary/10 min-h-[280px]">
                  {/* SVG for connection lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    {/* User to Interests connections */}
                    {analysis.interests.slice(0, 3).map((_, idx) => {
                      const angle = (idx * 120 - 60) * (Math.PI / 180);
                      const endX = 50 + Math.cos(angle) * 25;
                      const endY = 50 + Math.sin(angle) * 35;
                      return (
                        <line
                          key={`user-interest-${idx}`}
                          x1="50%"
                          y1="40%"
                          x2={`${endX}%`}
                          y2={`${endY}%`}
                          stroke="hsl(var(--primary) / 0.4)"
                          strokeWidth="2"
                        />
                      );
                    })}
                    
                    {/* Interests to Topics connections */}
                    {analysis.interests.slice(0, 3).map((_, interestIdx) => {
                      const interestAngle = (interestIdx * 120 - 60) * (Math.PI / 180);
                      const startX = 50 + Math.cos(interestAngle) * 25;
                      const startY = 50 + Math.sin(interestAngle) * 35;
                      
                      return analysis.topics.slice(0, 3).map((_, topicIdx) => {
                        const topicAngle = (topicIdx * 120 - 60) * (Math.PI / 180);
                        const endX = 50 + Math.cos(topicAngle) * 45;
                        const endY = 50 + Math.sin(topicAngle) * 55;
                        
                        return (
                          <line
                            key={`interest-${interestIdx}-topic-${topicIdx}`}
                            x1={`${startX}%`}
                            y1={`${startY}%`}
                            x2={`${endX}%`}
                            y2={`${endY}%`}
                            stroke="hsl(var(--secondary) / 0.2)"
                            strokeWidth="1"
                            strokeDasharray="3,3"
                          />
                        );
                      });
                    })}
                  </svg>

                  {/* User Node (Center) */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 3 }}>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-primary blur-lg opacity-60 rounded-full animate-pulse" />
                      <div className="relative w-20 h-20 rounded-full bg-gradient-primary border-4 border-primary flex items-center justify-center shadow-2xl">
                        <span className="text-2xl">👤</span>
                      </div>
                    </div>
                    <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-bold text-primary whitespace-nowrap">
                      You
                    </span>
                  </div>

                  {/* Interest Nodes (Middle Ring) */}
                  {analysis.interests.slice(0, 3).map((interest, idx) => {
                    const angle = (idx * 120 - 60) * (Math.PI / 180);
                    const x = 50 + Math.cos(angle) * 25;
                    const y = 50 + Math.sin(angle) * 35;
                    
                    return (
                      <div
                        key={idx}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${x}%`, top: `${y}%`, zIndex: 2 }}
                      >
                        <div className="relative group">
                          <div className="absolute inset-0 bg-primary/30 blur-md rounded-full group-hover:bg-primary/50 transition-all" />
                          <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary/80 to-primary border-2 border-primary/50 flex items-center justify-center shadow-lg">
                            <span className="text-lg">🎯</span>
                          </div>
                        </div>
                        <span className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-[10px] text-primary font-medium text-center max-w-[80px] line-clamp-2">
                          {interest}
                        </span>
                      </div>
                    );
                  })}

                  {/* Topic Nodes (Outer Ring) */}
                  {analysis.topics.slice(0, 3).map((topic, idx) => {
                    const angle = (idx * 120 - 60) * (Math.PI / 180);
                    const x = 50 + Math.cos(angle) * 45;
                    const y = 50 + Math.sin(angle) * 55;
                    
                    return (
                      <div
                        key={idx}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${x}%`, top: `${y}%`, zIndex: 1 }}
                      >
                        <div className="relative group">
                          <div className="absolute inset-0 bg-secondary/30 blur-md rounded-full group-hover:bg-secondary/50 transition-all" />
                          <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-secondary/70 to-secondary/50 border-2 border-secondary/40 flex items-center justify-center shadow-lg">
                            <span className="text-base">📚</span>
                          </div>
                        </div>
                        <span className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-[9px] text-secondary font-medium text-center max-w-[70px] line-clamp-2">
                          {topic}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};
