import { BookMarked, Bookmark, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DashboardStatsProps {
  total: number;
  reading: number;
  tags: number;
  selectedFilter: "all" | "reading";
  onFilterChange: (filter: "all" | "reading") => void;
}

export const DashboardStats = ({
  total,
  reading,
  tags,
  selectedFilter,
  onFilterChange,
}: DashboardStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card
        className={`glass-card p-6 cursor-pointer transition-all hover:shadow-md ${
          selectedFilter === "all" ? "ring-2 ring-primary shadow-glow" : ""
        }`}
        onClick={() => onFilterChange("all")}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-primary">
            <Bookmark className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Bookmarks</p>
            <p className="text-3xl font-bold">{total}</p>
          </div>
        </div>
      </Card>

      <Card
        className={`glass-card p-6 cursor-pointer transition-all hover:shadow-md ${
          selectedFilter === "reading" ? "ring-2 ring-secondary shadow-glow" : ""
        }`}
        onClick={() => onFilterChange("reading")}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-secondary">
            <BookMarked className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Reading List</p>
            <p className="text-3xl font-bold">{reading}</p>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-r from-warning to-primary">
            <Tag className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Unique Tags</p>
            <p className="text-3xl font-bold">{tags}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
