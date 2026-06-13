import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Folder, Loader2, MoreVertical, Trash, Download, Edit, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { ProjectSummaryResponse } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { generateGradient, cn } from "@/lib/utils";
import { UserMenu } from "@/components/UserMenu";

// Modern dashboard visual mock options (Top 60% of card)
const CARD_TEMPLATES = [
  // Option 1: Animated gradient orb in dark scanner grid
  (name: string) => (
    <div className="w-full h-full bg-[#0d0d11] relative overflow-hidden flex items-center justify-center border border-white/[0.03]">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:14px_14px]" />
      
      {/* Animated neon orb */}
      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 blur-xl animate-pulse relative z-10 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full bg-white/5 border border-white/20 flex items-center justify-center shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
        </div>
      </div>
      
      {/* Small design coordinate line */}
      <div className="absolute left-4 right-4 bottom-3 flex items-center justify-between text-[8px] font-mono text-muted-foreground/45 z-10">
        <span>SYS.ACTIVE // TRACER</span>
        <span>0x9F4C</span>
      </div>
    </div>
  ),
  // Option 2: Server activity graph bars (Muted tech graph)
  (name: string) => (
    <div className="w-full h-full bg-[#0d0d11] relative overflow-hidden flex flex-col justify-end p-4 border border-white/[0.03]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_100%]" />
      
      {/* Graph Bars */}
      <div className="flex items-end gap-1.5 h-12 relative z-10">
        {[40, 65, 30, 85, 50, 70, 95, 45, 60, 80, 35, 90].map((h, i) => (
          <div key={i} className="flex-1 bg-white/5 border-t border-white/10 rounded-sm relative overflow-hidden group-hover:bg-white/10 transition-colors duration-200" style={{ height: `${h}%` }}>
            {i === 6 && <div className="absolute inset-0 bg-blue-500/30 animate-pulse" />}
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-between text-[8px] font-mono text-muted-foreground/45 mt-3 pt-2 border-t border-white/[0.04] relative z-10">
        <span>QUERY LATENCY</span>
        <span>99.2% UP</span>
      </div>
    </div>
  ),
  // Option 3: Terminal process logs loading
  (name: string) => (
    <div className="w-full h-full bg-[#070709] relative overflow-hidden flex flex-col justify-between p-3 font-mono text-[8px] text-muted-foreground/60 border border-white/[0.03]">
      <div className="flex items-center justify-between text-muted-foreground/40 border-b border-white/[0.04] pb-1.5 mb-1">
        <span>RUNNING BUILD</span>
        <span className="w-2 h-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
        </span>
      </div>
      <div className="space-y-1 flex-1 py-1">
        <div className="text-white/60">$ vite build --mode production</div>
        <div>✓ 142 modules transformed.</div>
        <div className="text-blue-400/80">rendering chunks... [89%]</div>
      </div>
      <div className="text-[7px] text-muted-foreground/30 flex justify-between pt-1 border-t border-white/[0.04]">
        <span>TASK ID: {Math.abs(name.charCodeAt(0) * 1024)}</span>
        <span>1.4s</span>
      </div>
    </div>
  ),
  // Option 4: Coordinate circular node tracker
  (name: string) => (
    <div className="w-full h-full bg-[#0d0d11] relative overflow-hidden flex items-center justify-center border border-white/[0.03]">
      {/* Concentric rings */}
      <div className="absolute w-24 h-24 rounded-full border border-white/[0.02] flex items-center justify-center">
        <div className="absolute w-16 h-16 rounded-full border border-white/[0.03] flex items-center justify-center">
          <div className="absolute w-8 h-8 rounded-full border border-white/[0.04]" />
        </div>
      </div>
      
      {/* Coordinate dots */}
      <div className="absolute top-1/4 left-1/3 w-1.5 h-1.5 rounded-full bg-white/40" />
      <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-ping" />
      <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 rounded-full bg-blue-400" />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:10px_10px]" />
      
      <div className="absolute left-3 bottom-2.5 text-[8px] font-mono text-muted-foreground/45 z-10">
        <span>LOC // 44.8°N</span>
      </div>
    </div>
  ),
  // Option 5: Database schema mockup
  (name: string) => (
    <div className="w-full h-full bg-[#0a0a0d] relative overflow-hidden p-3 border border-white/[0.03] flex flex-col justify-between">
      {/* Background blueprint grid */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:8px_8px]" />
      
      <div className="flex gap-2 relative z-10">
        {/* Table 1 */}
        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded p-1.5 font-mono text-[7px] text-muted-foreground/80">
          <div className="text-white/70 font-semibold border-b border-white/[0.04] pb-0.5 mb-1 flex items-center justify-between">
            <span>users</span>
            <span className="text-[5px] text-blue-400">PK</span>
          </div>
          <div className="space-y-0.5">
            <div>id <span className="text-[6px] text-muted-foreground/40">int4</span></div>
            <div>email <span className="text-[6px] text-muted-foreground/40">varchar</span></div>
            <div>role <span className="text-[6px] text-muted-foreground/40">text</span></div>
          </div>
        </div>
        
        {/* Table 2 */}
        <div className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded p-1.5 font-mono text-[7px] text-muted-foreground/80">
          <div className="text-white/70 font-semibold border-b border-white/[0.04] pb-0.5 mb-1 flex items-center justify-between">
            <span>projects</span>
            <span className="text-[5px] text-emerald-400">FK</span>
          </div>
          <div className="space-y-0.5">
            <div>id <span className="text-[6px] text-muted-foreground/40">int4</span></div>
            <div>name <span className="text-[6px] text-muted-foreground/40">text</span></div>
            <div>user_id <span className="text-[6px] text-muted-foreground/40">int4</span></div>
          </div>
        </div>
      </div>
      
      <div className="text-[7px] font-mono text-muted-foreground/40 flex justify-between relative z-10">
        <span>SCHEMA: PUBLIC</span>
        <span>2 TABLES REL.</span>
      </div>
    </div>
  ),
  // Option 6: Git branch node graph
  (name: string) => (
    <div className="w-full h-full bg-[#0a0a0d] relative overflow-hidden p-3 border border-white/[0.03] flex flex-col justify-between font-mono text-[7.5px] text-muted-foreground/60">
      <div className="text-[7px] text-muted-foreground/35 border-b border-white/[0.03] pb-1">GIT HISTORY</div>
      <div className="flex-1 flex flex-col justify-center space-y-2.5 my-1 relative z-10 pl-2">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 ring-4 ring-blue-500/10" />
          <span className="text-white/70">feat: auth migration</span>
          <span className="text-[6px] text-muted-foreground/40">2h ago</span>
        </div>
        <div className="flex items-center gap-2 border-l border-white/10 pl-3 ml-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500/80" />
          <span>refactor: stripe webhook</span>
          <span className="text-[6px] text-muted-foreground/40">5h ago</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" />
          <span className="text-white/70">chore: release v1.0.4</span>
          <span className="text-[6px] text-muted-foreground/40">1d ago</span>
        </div>
      </div>
      <div className="text-[6px] text-muted-foreground/30 flex justify-between">
        <span>BRANCH: MAIN</span>
        <span>3 COMMITS AHEAD</span>
      </div>
    </div>
  ),
  // Option 7: Network Request waterfall (DevTools chart)
  (name: string) => (
    <div className="w-full h-full bg-[#08080b] relative overflow-hidden p-3 border border-white/[0.03] flex flex-col justify-between font-mono text-[7px] text-muted-foreground/60">
      <div className="flex items-center justify-between text-muted-foreground/45 border-b border-white/[0.04] pb-1 mb-1">
        <span>NETWORK INGEST</span>
        <span className="text-[6px] text-emerald-400">ONLINE</span>
      </div>
      <div className="flex-1 flex flex-col justify-center space-y-1.5 py-1">
        {/* Row 1 */}
        <div className="flex items-center gap-2">
          <span className="w-14 text-emerald-400 font-medium text-left">GET /api/user</span>
          <div className="flex-1 bg-white/[0.03] h-1.5 rounded-sm overflow-hidden relative">
            <div className="absolute left-[10%] w-[35%] h-full bg-emerald-500/40 rounded-sm" />
          </div>
          <span className="w-6 text-right text-[6px]">124ms</span>
        </div>
        {/* Row 2 */}
        <div className="flex items-center gap-2">
          <span className="w-14 text-blue-400 font-medium text-left">POST /graphql</span>
          <div className="flex-1 bg-white/[0.03] h-1.5 rounded-sm overflow-hidden relative">
            <div className="absolute left-[30%] w-[55%] h-full bg-blue-500/40 rounded-sm" />
          </div>
          <span className="w-6 text-right text-[6px]">310ms</span>
        </div>
        {/* Row 3 */}
        <div className="flex items-center gap-2">
          <span className="w-14 text-purple-400 font-medium text-left">GET /static/js</span>
          <div className="flex-1 bg-white/[0.03] h-1.5 rounded-sm overflow-hidden relative">
            <div className="absolute left-[5%] w-[15%] h-full bg-purple-500/40 rounded-sm" />
          </div>
          <span className="w-6 text-right text-[6px]">45ms</span>
        </div>
      </div>
      <div className="text-[6px] text-muted-foreground/30 flex justify-between pt-1 border-t border-white/[0.03]">
        <span>REQ COUNT: 14,204</span>
        <span>ERRS: 0.00%</span>
      </div>
    </div>
  ),
  // Option 8: Matrix / Coordinate mesh (blueprint grid)
  (name: string) => (
    <div className="w-full h-full bg-[#0d0d11] relative overflow-hidden flex items-center justify-center border border-white/[0.03]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:10px_10px]" />
      
      {/* Schematic overlay lines */}
      <div className="absolute w-[80%] h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
      <div className="absolute h-[80%] w-[1px] bg-gradient-to-b from-transparent via-blue-500/20 to-transparent" />
      
      <div className="relative z-10 flex flex-col items-center gap-1 font-mono text-[7px] text-muted-foreground/50">
        <div className="px-2 py-1 bg-white/[0.02] border border-white/[0.05] rounded-md backdrop-blur-sm flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50 animate-pulse" />
          <span className="text-white/60">SYS_MESH: STABLE</span>
        </div>
        <span>X: 184.22 // Y: 940.12</span>
      </div>
    </div>
  )
];

// Helper for formatting relative time
function getRelativeTimeString(dateString: string): string {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "recently";
        
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return "just now";
        }
        if (diffMins < 60) {
            return `${diffMins}m ago`;
        }
        if (diffHours < 24) {
            return `${diffHours}h ago`;
        }
        if (diffDays === 1) {
            return "yesterday";
        }
        if (diffDays < 7) {
            return `${diffDays}d ago`;
        }
        const diffWeeks = Math.floor(diffDays / 7);
        if (diffWeeks < 4) {
            return `${diffWeeks}w ago`;
        }
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) {
            return `${diffMonths}mo ago`;
        }
        return `${Math.floor(diffDays / 365)}y ago`;
    } catch (e) {
        return "recently";
    }
}

export function ProjectsDashboard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [projects, setProjects] = useState<ProjectSummaryResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Rename state
    const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
    const [projectToRename, setProjectToRename] = useState<ProjectSummaryResponse | null>(null);
    const [renameName, setRenameName] = useState("");

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const data = await api.getProjects();
            setProjects(data);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            toast({
                title: "Error",
                description: "Failed to load projects. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;

        setIsCreating(true);
        try {
            const newProject = await api.createProject(newProjectName);
            setProjects([newProject, ...projects]);
            setNewProjectName("");
            setIsDialogOpen(false);
            toast({
                title: "Success",
                description: "Project created successfully",
            });
            // Optionally navigate to the new project immediately
            // navigate(`/projects/${newProject.id}`);
        } catch (error: any) {
            console.error("Failed to create project:", error);
            const isQuotaError = error.message?.toLowerCase().includes("quota") || error.message?.toLowerCase().includes("limit");
            toast({
                title: isQuotaError ? "Quota Exceeded" : "Error",
                description: error.message || "Failed to create project",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: number) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;

        try {
            await api.deleteProject(projectId.toString());
            setProjects(projects.filter(p => p.id !== projectId));
            toast({ title: "Success", description: "Project deleted successfully" });
        } catch (error) {
            console.error("Failed to delete:", error);
            toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
        }
    };

    const handleDownloadProject = async (e: React.MouseEvent, projectId: number) => {
        e.stopPropagation();
        try {
            const blob = await api.downloadProjectZip(projectId.toString());
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `project-${projectId}.zip`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast({ title: "Success", description: "Download started" });
        } catch (error) {
            console.error("Failed to download:", error);
            toast({ title: "Error", description: "Failed to download project", variant: "destructive" });
        }
    };

    const handleRenameClick = (e: React.MouseEvent, project: ProjectSummaryResponse) => {
        e.stopPropagation();
        setProjectToRename(project);
        setRenameName(project.name);
        setIsRenameDialogOpen(true);
    };

    const handleRenameSubmit = async () => {
        if (!projectToRename || !renameName.trim()) return;

        try {
            await api.updateProject(projectToRename.id.toString(), renameName);
            setProjects(projects.map(p => p.id === projectToRename.id ? { ...p, name: renameName } : p));
            setIsRenameDialogOpen(false);
            setProjectToRename(null);
            toast({ title: "Success", description: "Project renamed successfully" });
        } catch (error) {
            console.error("Failed to rename:", error);
            toast({ title: "Error", description: "Failed to rename project", variant: "destructive" });
        }
    };

    const filteredProjects = projects.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-background sticky top-0 z-50">
                <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-8">
                    <div className="flex items-center gap-2 font-medium text-base tracking-tight text-white">
                        <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center border border-border">
                            <Folder className="w-4 h-4 text-foreground/90" />
                        </div>
                        <span className="font-display font-semibold text-white">Genesis</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="bg-background border-border hover:bg-secondary hover:text-white rounded-lg h-9"
                            onClick={() => navigate("/pricing")}
                        >
                            Upgrade Plan
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="w-9 h-9 bg-background border-border hover:bg-secondary hover:text-white rounded-lg"
                            onClick={() => navigate("/billing")}
                            title="Billing & Subscription"
                        >
                            <CreditCard className="w-4 h-4" />
                        </Button>
                        <UserMenu />
                    </div>
                </div>
            </header>

            <main className="container max-w-screen-2xl py-10 px-4 sm:px-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-white">Projects</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            Turn prompts into applications
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 bg-primary hover:bg-primary/90 rounded-lg px-4 h-10 text-primary-foreground font-medium">
                                <Plus className="w-4 h-4" />
                                New Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border rounded-lg">
                            <DialogHeader>
                                <DialogTitle className="font-display text-lg font-semibold">Create New Project</DialogTitle>
                                <DialogDescription className="text-muted-foreground text-sm">
                                    Give your project a name to get started. You can change this later.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <Input
                                    placeholder="My Awesome Project"
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                                    className="bg-background border-border focus-visible:ring-ring rounded-lg h-10"
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" className="rounded-lg" onClick={() => setIsDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateProject} disabled={isCreating || !newProjectName.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                                    {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Project
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Rename Dialog */}
                    <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
                        <DialogContent className="bg-card border border-border rounded-lg">
                            <DialogHeader>
                                <DialogTitle className="font-display text-lg font-semibold">Rename Project</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Input
                                    value={renameName}
                                    onChange={(e) => setRenameName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
                                    className="bg-background border-border focus-visible:ring-ring rounded-lg h-10"
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" className="rounded-lg" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleRenameSubmit} disabled={!renameName.trim() || renameName === projectToRename?.name} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                                    Save
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Search */}
                <div className="relative mb-10 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search projects..."
                        className="pl-9 h-10 bg-background border-border focus-visible:ring-ring rounded-lg"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-24 border border-border border-dashed rounded-lg bg-card">
                        <h3 className="text-lg font-medium mb-2 font-display">No projects found</h3>
                        <p className="text-muted-foreground mb-6 text-sm">
                            {searchQuery ? "Try a different search query" : "Create your first project to get started"}
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => setIsDialogOpen(true)} className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-4">Create Project</Button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProjects.map((project) => (
                            <Card
                                key={project.id}
                                className="group cursor-pointer bg-card border-border hover:border-white/20 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(59,130,246,0.08)] rounded-lg overflow-hidden transition-all duration-300"
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                <CardHeader className="p-0 border-b border-border">
                                    <div className="aspect-video bg-background w-full relative overflow-hidden flex flex-col font-mono text-[9px] text-muted-foreground p-3 select-none">
                                        {project.thumbnailUrl ? (
                                            <img
                                                src={project.thumbnailUrl}
                                                alt={project.name}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
                                            />
                                        ) : (
                                            CARD_TEMPLATES[project.id % CARD_TEMPLATES.length](project.name)
                                        )}
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 flex flex-col gap-1.5">
                                    <div className="flex justify-between items-start gap-2">
                                        <CardTitle className="text-base font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                            {project.name}
                                        </CardTitle>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground hover:text-foreground rounded-lg">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-card border-border rounded-lg">
                                                <DropdownMenuItem onClick={(e) => handleRenameClick(e, project)} className="rounded-md">
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    Rename
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => handleDownloadProject(e, project.id)} className="rounded-md">
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-500 focus:text-red-500 rounded-md" onClick={(e) => handleDeleteProject(e, project.id)}>
                                                    <Trash className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    {project.role && (
                                        <div className="flex">
                                            <span className={cn(
                                                "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border bg-white/5 text-muted-foreground/85 border-white/[0.08]"
                                            )}>
                                                {project.role}
                                            </span>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="px-4 pb-4 pt-0 text-[11px] text-muted-foreground/50">
                                    Updated {getRelativeTimeString(project.createdAt)}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
