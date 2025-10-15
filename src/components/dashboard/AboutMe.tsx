import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Sparkles, Mail, Calendar, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface Profile {
  email: string;
  created_at: string;
}

interface PersonalityAnalysis {
  interests: string[];
  topics: string[];
  readingPatterns: string;
  personalityTraits: string[];
}

export const AboutMe = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<PersonalityAnalysis | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('email, created_at')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setProfile(data);
        }
      }
    };

    fetchProfile();
  }, []);

  const handleAnalyzeClick = async () => {
    setIsDialogOpen(true);
    setIsLoading(true);
    setAnalysis(null);

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

  if (!profile) return null;

  const initials = profile.email.substring(0, 2).toUpperCase();
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      <Card 
        className="relative overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-glow group"
        style={{
          background: 'linear-gradient(135deg, hsl(282 89% 66% / 0.1) 0%, hsl(258 89% 66% / 0.1) 100%)',
          borderColor: 'hsl(var(--primary) / 0.3)',
        }}
        onClick={handleAnalyzeClick}
      >
        <div className="absolute inset-0 bg-gradient-hero opacity-5" />
        <CardHeader>
          <CardTitle className="flex items-center gap-2 relative z-10">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" 
              style={{ 
                filter: 'drop-shadow(0 0 8px hsl(var(--primary-glow) / 0.6))',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
              }}
            />
            About Me
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 relative z-10">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16 border-2 border-primary/30">
              <AvatarFallback className="text-lg bg-gradient-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                {profile.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Calendar className="w-4 h-4" />
                Joined {joinDate}
              </div>
            </div>
          </div>
          <div className="text-xs text-center text-muted-foreground pt-2 border-t border-primary/20 group-hover:text-primary transition-colors">
            Click to discover your personality insights ✨
          </div>
        </CardContent>
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
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing your bookmarks...</p>
            </div>
          ) : analysis ? (
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  🎯 Main Interests
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.interests.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm border border-primary/20"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  📚 Key Topics
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.topics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm border border-secondary/20"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  📖 Reading Patterns
                </h3>
                <p className="text-muted-foreground leading-relaxed bg-muted/50 p-4 rounded-lg">
                  {analysis.readingPatterns}
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  ✨ Personality Traits
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysis.personalityTraits.map((trait, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 rounded-lg bg-accent/10 text-accent border border-accent/20"
                    >
                      {trait}
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
