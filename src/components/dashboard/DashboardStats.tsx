import { BookMarked, Bookmark, Tag, FolderOpen, TrendingUp, Sparkles } from "lucide-react";
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
    <div className="grid grid-cols-4 gap-3 mb-4 max-w-full">
      <Card
        className={`glass-card p-2.5 cursor-pointer transition-all duration-200 hover:scale-[1.02] group ${
          selectedFilter === "all" ? "ring-1 ring-primary shadow-glow" : "hover:shadow-md"
        }`}
        onClick={() => onFilterChange("all")}
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded w-fit transition-all duration-200 ${
              selectedFilter === "all" ? "bg-gradient-primary" : "bg-primary/10 group-hover:bg-gradient-primary"
            }`}>
              <Bookmark className={`w-2.5 h-2.5 ${
                selectedFilter === "all" ? "text-white" : "text-primary group-hover:text-white"
              }`} />
            </div>
            <p className="text-lg font-bold tracking-tight">{total}</p>
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-tight">Total Bookmarks</p>
        </div>
      </Card>

      <Card
        className={`glass-card p-2.5 cursor-pointer transition-all duration-200 hover:scale-[1.02] group ${
          selectedFilter === "reading" ? "ring-1 ring-secondary shadow-glow" : "hover:shadow-md"
        }`}
        onClick={() => onFilterChange("reading")}
      >
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <div className={`p-1 rounded w-fit transition-all duration-200 ${
              selectedFilter === "reading" ? "bg-secondary" : "bg-secondary/10 group-hover:bg-secondary"
            }`}>
              <BookMarked className={`w-2.5 h-2.5 ${
                selectedFilter === "reading" ? "text-white" : "text-secondary group-hover:text-white"
              }`} />
            </div>
            <p className="text-lg font-bold tracking-tight">{reading}</p>
          </div>
          <p className="text-xs text-muted-foreground font-medium leading-tight">Reading List</p>
        </div>
      </Card>

      {/* Combined Stats Card */}
      <Card className="glass-card p-2.5 transition-all duration-200 hover:shadow-md col-span-2">
        <div className="grid grid-cols-3 gap-3 h-full">
          <div className="flex flex-col gap-1.5 justify-center bg-muted/30 rounded-lg p-2.5 border border-foreground/10">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded w-fit bg-warning/10 group-hover:bg-warning transition-all duration-200">
                <Tag className="w-2.5 h-2.5 text-warning" />
              </div>
              <p className="text-lg font-bold tracking-tight">{tags}</p>
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-tight">Unique Tags</p>
          </div>

          <div className="flex flex-col gap-1.5 justify-center bg-muted/30 rounded-lg p-2.5 border border-foreground/10">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded w-fit bg-accent/10 group-hover:bg-accent transition-all duration-200">
                <FolderOpen className="w-2.5 h-2.5 text-accent" />
              </div>
              <p className="text-lg font-bold tracking-tight">{categories}</p>
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-tight">Categories</p>
          </div>

          <div className="flex flex-col gap-1.5 justify-center bg-muted/30 rounded-lg p-2.5 border border-foreground/10">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded w-fit bg-success/10 group-hover:bg-success transition-all duration-200">
                <TrendingUp className="w-2.5 h-2.5 text-success" />
              </div>
              <p className="text-lg font-bold tracking-tight">{thisWeek}</p>
            </div>
            <p className="text-xs text-muted-foreground font-medium leading-tight">This Week</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
