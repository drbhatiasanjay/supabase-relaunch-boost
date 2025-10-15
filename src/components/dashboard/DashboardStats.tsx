import { BookMarked, Bookmark, Tag, FolderOpen, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DashboardStatsProps {
  total: number;
  reading: number;
  tags: number;
  categories: number;
  thisWeek: number;
  selectedFilter: "all" | "reading";
  onFilterChange: (filter: "all" | "reading") => void;
}

export const DashboardStats = ({
  total,
  reading,
  tags,
  categories,
  thisWeek,
  selectedFilter,
  onFilterChange,
}: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      <Card
        className={`glass-card p-4 sm:p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02] group ${
          selectedFilter === "all" ? "ring-2 ring-primary shadow-glow" : "hover:shadow-md"
        }`}
        onClick={() => onFilterChange("all")}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-lg transition-all duration-200 ${
              selectedFilter === "all" ? "bg-gradient-primary" : "bg-primary/10 group-hover:bg-gradient-primary"
            }`}>
              <Bookmark className={`w-5 h-5 ${
                selectedFilter === "all" ? "text-white" : "text-primary group-hover:text-white"
              }`} />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Total Bookmarks</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{total}</p>
          </div>
        </div>
      </Card>

      <Card
        className={`glass-card p-4 sm:p-5 cursor-pointer transition-all duration-200 hover:scale-[1.02] group ${
          selectedFilter === "reading" ? "ring-2 ring-secondary shadow-glow" : "hover:shadow-md"
        }`}
        onClick={() => onFilterChange("reading")}
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className={`p-2.5 rounded-lg transition-all duration-200 ${
              selectedFilter === "reading" ? "bg-secondary" : "bg-secondary/10 group-hover:bg-secondary"
            }`}>
              <BookMarked className={`w-5 h-5 ${
                selectedFilter === "reading" ? "text-white" : "text-secondary group-hover:text-white"
              }`} />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Reading List</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{reading}</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-4 sm:p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-md group">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-warning/10 group-hover:bg-warning transition-all duration-200">
              <Tag className="w-5 h-5 text-warning group-hover:text-white" />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Unique Tags</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{tags}</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-4 sm:p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-md group">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-accent/10 group-hover:bg-accent transition-all duration-200">
              <FolderOpen className="w-5 h-5 text-accent group-hover:text-white" />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Categories</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{categories}</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-4 sm:p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-md group">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="p-2.5 rounded-lg bg-success/10 group-hover:bg-success transition-all duration-200">
              <TrendingUp className="w-5 h-5 text-success group-hover:text-white" />
            </div>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">This Week</p>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight">{thisWeek}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
