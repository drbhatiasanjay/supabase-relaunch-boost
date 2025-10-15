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
    <div className="grid grid-cols-5 gap-1.5 mb-4 max-w-2xl">
      <Card
        className={`glass-card p-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] group ${
          selectedFilter === "all" ? "ring-1 ring-primary shadow-glow" : "hover:shadow-md"
        }`}
        onClick={() => onFilterChange("all")}
      >
        <div className="flex flex-col gap-1">
          <div className={`p-1 rounded w-fit transition-all duration-200 ${
            selectedFilter === "all" ? "bg-gradient-primary" : "bg-primary/10 group-hover:bg-gradient-primary"
          }`}>
            <Bookmark className={`w-2.5 h-2.5 ${
              selectedFilter === "all" ? "text-white" : "text-primary group-hover:text-white"
            }`} />
          </div>
          <div>
            <p className="text-[8px] text-muted-foreground font-medium leading-tight">Total Bookmarks</p>
            <p className="text-sm font-bold tracking-tight">{total}</p>
          </div>
        </div>
      </Card>

      <Card
        className={`glass-card p-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] group ${
          selectedFilter === "reading" ? "ring-1 ring-secondary shadow-glow" : "hover:shadow-md"
        }`}
        onClick={() => onFilterChange("reading")}
      >
        <div className="flex flex-col gap-1">
          <div className={`p-1 rounded w-fit transition-all duration-200 ${
            selectedFilter === "reading" ? "bg-secondary" : "bg-secondary/10 group-hover:bg-secondary"
          }`}>
            <BookMarked className={`w-2.5 h-2.5 ${
              selectedFilter === "reading" ? "text-white" : "text-secondary group-hover:text-white"
            }`} />
          </div>
          <div>
            <p className="text-[8px] text-muted-foreground font-medium leading-tight">Reading List</p>
            <p className="text-sm font-bold tracking-tight">{reading}</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-md group">
        <div className="flex flex-col gap-1">
          <div className="p-1 rounded w-fit bg-warning/10 group-hover:bg-warning transition-all duration-200">
            <Tag className="w-2.5 h-2.5 text-warning group-hover:text-white" />
          </div>
          <div>
            <p className="text-[8px] text-muted-foreground font-medium leading-tight">Unique Tags</p>
            <p className="text-sm font-bold tracking-tight">{tags}</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-md group">
        <div className="flex flex-col gap-1">
          <div className="p-1 rounded w-fit bg-accent/10 group-hover:bg-accent transition-all duration-200">
            <FolderOpen className="w-2.5 h-2.5 text-accent group-hover:text-white" />
          </div>
          <div>
            <p className="text-[8px] text-muted-foreground font-medium leading-tight">Categories</p>
            <p className="text-sm font-bold tracking-tight">{categories}</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-2 transition-all duration-200 hover:scale-[1.02] hover:shadow-md group">
        <div className="flex flex-col gap-1">
          <div className="p-1 rounded w-fit bg-success/10 group-hover:bg-success transition-all duration-200">
            <TrendingUp className="w-2.5 h-2.5 text-success group-hover:text-white" />
          </div>
          <div>
            <p className="text-[8px] text-muted-foreground font-medium leading-tight">This Week</p>
            <p className="text-sm font-bold tracking-tight">{thisWeek}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
