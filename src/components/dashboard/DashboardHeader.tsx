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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 max-w-[1800px]">
        <div className="flex items-center gap-4">
          {/* Logo & Sidebar Toggle */}
          <div className="flex items-center gap-3 min-w-fit">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="h-9 w-9 hover:bg-accent/10"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </Button>
            <div className="relative hidden sm:flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-primary blur-md opacity-40" />
                <div className="relative bg-gradient-primary p-2 rounded-lg">
                  <Bookmark className="w-5 h-5 text-white" />
                </div>
              </div>
              <h1 className="text-lg font-bold gradient-text whitespace-nowrap">BookmarkHub</h1>
            </div>
          </div>

          {/* Search - Expanded for better visibility */}
          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder="Search bookmarks, tags, descriptions..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 pr-4 h-10 w-full bg-muted/50 border-border/50 focus:bg-background transition-colors"
              />
            </div>
          </div>

          {/* Action Buttons - Refined spacing */}
          <div className="flex items-center gap-2">
            {/* View Mode Selector - Unified component */}
            <div className="hidden lg:flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5 border border-border/50">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => onViewModeChange("grid")}
                className="h-8 w-8 transition-all"
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => onViewModeChange("list")}
                className="h-8 w-8 transition-all"
                title="List view"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "compact" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => onViewModeChange("compact")}
                className="h-8 w-8 transition-all"
                title="Compact view"
              >
                <AlignJustify className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={onImportExportClick}
              variant="outline"
              size="sm"
              className="hidden md:flex h-9 gap-2 hover:bg-accent/10"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden xl:inline">Import/Export</span>
            </Button>

            <Button 
              onClick={onAddClick}
              className="bg-gradient-primary hover:opacity-90 transition-opacity h-9 gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Bookmark</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-9 w-9 hover:bg-accent/10">
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">Account</p>
                    <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
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
      </div>
    </header>
  );
};
