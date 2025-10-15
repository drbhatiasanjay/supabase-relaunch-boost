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
    <div className="grid grid-cols-5 gap-2 mb-6 max-w-4xl">
      <Card
        className={`glass-card p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] group ${
          selectedFilter === "all" ? "ring-2 ring-primary shadow-glow" : "hover:shadow-md"
        }`}
        onClick={() => onFilterChange("all")}
      >
        <div className="flex flex-col gap-2">
          <div className={`p-1.5 rounded-md w-fit transition-all duration-200 ${
            selectedFilter === "all" ? "bg-gradient-primary" : "bg-primary/10 group-hover:bg-gradient-primary"
          }`}>
            <Bookmark className={`w-3.5 h-3.5 ${
              selectedFilter === "all" ? "text-white" : "text-primary group-hover:text-white"
            }`} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Total Bookmarks</p>
            <p className="text-xl font-bold tracking-tight">{total}</p>
          </div>
        </div>
      </Card>

      <Card
        className={`glass-card p-3 cursor-pointer transition-all duration-200 hover:scale-[1.02] group ${
          selectedFilter === "reading" ? "ring-2 ring-secondary shadow-glow" : "hover:shadow-md"
        }`}
        onClick={() => onFilterChange("reading")}
      >
        <div className="flex flex-col gap-2">
          <div className={`p-1.5 rounded-md w-fit transition-all duration-200 ${
            selectedFilter === "reading" ? "bg-secondary" : "bg-secondary/10 group-hover:bg-secondary"
          }`}>
            <BookMarked className={`w-3.5 h-3.5 ${
              selectedFilter === "reading" ? "text-white" : "text-secondary group-hover:text-white"
            }`} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Reading List</p>
            <p className="text-xl font-bold tracking-tight">{reading}</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-md group">
        <div className="flex flex-col gap-2">
          <div className="p-1.5 rounded-md w-fit bg-warning/10 group-hover:bg-warning transition-all duration-200">
            <Tag className="w-3.5 h-3.5 text-warning group-hover:text-white" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Unique Tags</p>
            <p className="text-xl font-bold tracking-tight">{tags}</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-md group">
        <div className="flex flex-col gap-2">
          <div className="p-1.5 rounded-md w-fit bg-accent/10 group-hover:bg-accent transition-all duration-200">
            <FolderOpen className="w-3.5 h-3.5 text-accent group-hover:text-white" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">Categories</p>
            <p className="text-xl font-bold tracking-tight">{categories}</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-3 transition-all duration-200 hover:scale-[1.02] hover:shadow-md group">
        <div className="flex flex-col gap-2">
          <div className="p-1.5 rounded-md w-fit bg-success/10 group-hover:bg-success transition-all duration-200">
            <TrendingUp className="w-3.5 h-3.5 text-success group-hover:text-white" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium mb-0.5">This Week</p>
            <p className="text-xl font-bold tracking-tight">{thisWeek}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
