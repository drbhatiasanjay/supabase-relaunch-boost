import { Bookmark, LogOut, Search, User, Download, Upload, LayoutGrid, List, AlignJustify, PanelLeftClose, PanelLeft, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";

interface DashboardHeaderProps {
  userEmail: string;
  onSignOut: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddClick: () => void;
  onImportExportClick: () => void;
  viewMode: "grid" | "list" | "compact";
  onViewModeChange: (mode: "grid" | "list" | "compact") => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const DashboardHeader = ({
  userEmail,
  onSignOut,
  searchQuery,
  onSearchChange,
  onAddClick,
  onImportExportClick,
  viewMode,
  onViewModeChange,
  onToggleSidebar,
  isSidebarOpen,
}: DashboardHeaderProps) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur-lg bg-background/80">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="h-9 w-9"
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-primary blur-lg opacity-50" />
            <div className="relative bg-gradient-primary p-2 rounded-xl">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold gradient-text">BookmarkHub</h1>
        </div>

        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search bookmarks, tags, descriptions..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1 border border-border/50 rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("grid")}
              className="h-8 w-8"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("list")}
              className="h-8 w-8"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "compact" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => onViewModeChange("compact")}
              className="h-8 w-8"
            >
              <AlignJustify className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={onImportExportClick}
            variant="outline"
            size="sm"
            className="hidden md:flex"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import/Export
          </Button>

          <Button 
            onClick={onAddClick}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Add Bookmark</span>
            <span className="sm:hidden">Add</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">Account</p>
                  <p className="text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = '/settings'}>
                <SettingsIcon className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="md:hidden px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </header>
  );
};
