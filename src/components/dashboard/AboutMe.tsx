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
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg w-fit bg-gradient-primary shadow-[0_0_20px_hsl(var(--primary)/0.5)] group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.7)] transition-all duration-200">
            <Sparkles 
              className="w-4 h-4 text-white animate-pulse" 
              style={{ 
                filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'
              }}
            />
          </div>
          <p className="text-sm font-bold tracking-tight">About Me</p>
        </div>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-gradient-to-br from-background via-primary/5 to-secondary/5">
          <DialogHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-xl bg-gradient-primary bg-clip-text text-transparent">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                Your Personality Insights
              </DialogTitle>
              <DialogDescription className="text-sm m-0 text-center">
                AI-powered analysis
              </DialogDescription>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Analyzing your bookmarks...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-2.5 py-2 flex-1 overflow-hidden">
              {/* Two Column Layout: Personality Traits and Reading Patterns */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* Personality Traits - Left Column */}
                <div className="space-y-1.5 bg-gradient-to-br from-accent/10 to-accent/5 p-2.5 rounded-lg border border-accent/20">
                  <h3 className="text-xs font-bold flex items-center gap-1.5 text-accent">
                    ✨ Personality Traits
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {analysis.personalityTraits.map((trait, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-[10px] font-medium border border-accent/30 shadow-sm"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Reading Patterns - Right Column */}
                <div className="space-y-1.5 bg-gradient-to-br from-muted/50 to-muted/20 p-2.5 rounded-lg border border-muted-foreground/10">
                  <h3 className="text-xs font-bold flex items-center gap-1.5">
                    📖 Reading Patterns
                  </h3>
                  <p className="text-[10px] text-foreground/80 leading-relaxed font-medium">
                    {analysis.readingPatterns}
                  </p>
                </div>
              </div>

              {/* Neo4J-Style Knowledge Graph - Below */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold flex items-center gap-1.5 bg-gradient-primary bg-clip-text text-transparent">
                  🧠 Knowledge Graph
                </h3>
                <div className="relative bg-gradient-to-br from-primary/10 via-secondary/10 to-transparent p-3 rounded-lg border-2 border-primary/20 h-[180px] shadow-xl overflow-hidden">
                  {/* SVG for connection lines */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                    {/* User to Interests connections */}
                    {analysis.interests.slice(0, 3).map((_, idx) => {
                      const angle = (idx * 120 - 60) * (Math.PI / 180);
                      const endX = 50 + Math.cos(angle) * 22;
                      const endY = 50 + Math.sin(angle) * 30;
                      return (
                        <line
                          key={`user-interest-${idx}`}
                          x1="50%"
                          y1="45%"
                          x2={`${endX}%`}
                          y2={`${endY}%`}
                          stroke="hsl(var(--primary) / 0.5)"
                          strokeWidth="2.5"
                        />
                      );
                    })}
                    
                    {/* Interests to Topics connections */}
                    {analysis.interests.slice(0, 3).map((_, interestIdx) => {
                      const interestAngle = (interestIdx * 120 - 60) * (Math.PI / 180);
                      const startX = 50 + Math.cos(interestAngle) * 22;
                      const startY = 50 + Math.sin(interestAngle) * 30;
                      
                      return analysis.topics.slice(0, 3).map((_, topicIdx) => {
                        const topicAngle = (topicIdx * 120 - 60) * (Math.PI / 180);
                        const endX = 50 + Math.cos(topicAngle) * 40;
                        const endY = 50 + Math.sin(topicAngle) * 48;
                        
                        return (
                          <line
                            key={`interest-${interestIdx}-topic-${topicIdx}`}
                            x1={`${startX}%`}
                            y1={`${startY}%`}
                            x2={`${endX}%`}
                            y2={`${endY}%`}
                            stroke="hsl(var(--secondary) / 0.3)"
                            strokeWidth="1.5"
                            strokeDasharray="3,2"
                          />
                        );
                      });
                    })}
                  </svg>

                  {/* User Node (Center) */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" style={{ zIndex: 3 }}>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-primary blur-lg opacity-70 rounded-full animate-pulse" />
                      <div className="relative w-12 h-12 rounded-full bg-gradient-primary border-3 border-primary flex items-center justify-center shadow-2xl ring-2 ring-primary/20">
                        <span className="text-base">👤</span>
                      </div>
                    </div>
                    <span className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[9px] font-bold text-primary whitespace-nowrap">
                      You
                    </span>
                  </div>

                  {/* Interest Nodes (Middle Ring) */}
                  {analysis.interests.slice(0, 3).map((interest, idx) => {
                    const angle = (idx * 120 - 60) * (Math.PI / 180);
                    const x = 50 + Math.cos(angle) * 22;
                    const y = 50 + Math.sin(angle) * 30;
                    
                    return (
                      <div
                        key={idx}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${x}%`, top: `${y}%`, zIndex: 2 }}
                      >
                        <div className="relative group">
                          <div className="absolute inset-0 bg-primary/40 blur-md rounded-full group-hover:bg-primary/60 transition-all" />
                          <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/70 border-2 border-primary/70 flex items-center justify-center shadow-xl ring-2 ring-primary/30">
                            <span className="text-sm">🎯</span>
                          </div>
                        </div>
                        <span className="absolute top-full mt-0 left-1/2 transform -translate-x-1/2 text-[8px] text-primary font-bold text-center max-w-[60px] line-clamp-2 bg-background/90 px-1 rounded">
                          {interest}
                        </span>
                      </div>
                    );
                  })}

                  {/* Topic Nodes (Outer Ring) */}
                  {analysis.topics.slice(0, 3).map((topic, idx) => {
                    const angle = (idx * 120 - 60) * (Math.PI / 180);
                    const x = 50 + Math.cos(angle) * 40;
                    const y = 50 + Math.sin(angle) * 48;
                    
                    return (
                      <div
                        key={idx}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${x}%`, top: `${y}%`, zIndex: 1 }}
                      >
                        <div className="relative group">
                          <div className="absolute inset-0 bg-secondary/40 blur-md rounded-full group-hover:bg-secondary/60 transition-all" />
                          <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/60 border-2 border-secondary/50 flex items-center justify-center shadow-xl ring-2 ring-secondary/30">
                            <span className="text-xs">📚</span>
                          </div>
                        </div>
                        <span className="absolute top-full mt-0 left-1/2 transform -translate-x-1/2 text-[7px] text-secondary font-bold text-center max-w-[55px] line-clamp-2 bg-background/90 px-1 rounded">
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
