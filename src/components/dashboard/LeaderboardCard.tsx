import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp, Star, Bookmark } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useMemo } from "react";

interface LeaderboardCardProps {
  userId?: string;
}

export const LeaderboardCard = ({ userId }: LeaderboardCardProps) => {
  const { bookmarks } = useBookmarks(userId, null);

  const stats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const thisWeekCount = bookmarks.filter(b => new Date(b.created_at) >= weekAgo).length;
    const readingCount = bookmarks.filter(b => b.reading).length;
    const categoriesCount = new Set(bookmarks.map(b => b.category).filter(Boolean)).size;
    const tagsCount = new Set(bookmarks.flatMap(b => b.tags)).size;

    return {
      thisWeek: thisWeekCount,
      reading: readingCount,
      categories: categoriesCount,
      tags: tagsCount,
      total: bookmarks.length
    };
  }, [bookmarks]);

  const achievements = [
    {
      icon: Bookmark,
      label: "Total Bookmarks",
      value: stats.total,
      color: "text-primary"
    },
    {
      icon: TrendingUp,
      label: "This Week",
      value: stats.thisWeek,
      color: "text-green-500"
    },
    {
      icon: Star,
      label: "Categories",
      value: stats.categories,
      color: "text-yellow-500"
    },
    {
      icon: Trophy,
      label: "Unique Tags",
      value: stats.tags,
      color: "text-purple-500"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {achievements.map((achievement, index) => {
          const Icon = achievement.icon;
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${achievement.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{achievement.label}</span>
              </div>
              <span className="text-2xl font-bold">{achievement.value}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
