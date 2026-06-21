import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Code, Sparkles, LogOut, RotateCcw, Maximize2, RefreshCw, MoreVertical, Trash, Download, Edit } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChatPanel, ChatMessage } from "@/components/ChatPanel";
import { CodePanel } from "@/components/CodePanel";
import { PreviewPanel } from "@/components/PreviewPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { api, isAuthenticated, removeAuthToken, getUserInfo, removeUserInfo } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { RuntimeErrorAlert, RuntimeError } from "@/components/RuntimeErrorAlert";
import { generateGradient, cn } from "@/lib/utils";
import { ProjectResponse } from "@/lib/types";
import { ShareDialog } from "@/components/ShareDialog";

type ViewMode = "code" | "preview";

export function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [updatedFiles, setUpdatedFiles] = useState<Map<string, string>>(new Map());
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [runtimeError, setRuntimeError] = useState<RuntimeError | null>(null);
  const [project, setProject] = useState<ProjectResponse | null>(null);

  // Rename state
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [renameName, setRenameName] = useState("");

  // Track edited files for current streaming response
  const currentEditedFilesRef = useRef<string[]>([]);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
    }
  }, [navigate]);

  // Load chat history on mount
  useEffect(() => {
    if (!projectId) return;

    const loadData = async () => {
      setIsLoadingHistory(true);
      try {
        const [history, projectData] = await Promise.all([
          api.getChatHistory(projectId),
          api.getProject(projectId)
        ]);

        const formattedMessages: ChatMessage[] = history.map((msg) => ({
          id: msg.id.toString(),
          role: msg.role === "USER" ? "user" : "assistant",
          content: msg.content,
          createdAt: msg.createdAt,
          events: msg.events,
        }));
        setMessages(formattedMessages);
        setProject(projectData);
      } catch (error) {
        console.error("Failed to load project data:", error);
        toast({
          title: "Error",
          description: "Failed to load project data",
          variant: "destructive"
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadData();
  }, [projectId, toast]);

  // Send periodic heartbeat to keep the project preview runner/pod alive
  useEffect(() => {
    if (!projectId) return;

    // Send initial heartbeat
    api.heartbeat(projectId).catch((err) => {
      console.error("Failed to send initial heartbeat:", err);
    });

    const interval = setInterval(() => {
      api.heartbeat(projectId).catch((err) => {
        console.error("Failed to send heartbeat:", err);
      });
    }, 30000); // every 30 seconds

    return () => clearInterval(interval);
  }, [projectId]);

  const handleLogout = () => {
    removeAuthToken();
    removeUserInfo();
    navigate("/login");
  };

  const handleSendMessage = useCallback((content: string) => {
    if (!projectId) return;

    // Reset edited files tracker
    currentEditedFilesRef.current = [];

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);

    // Create placeholder for AI response
    const aiMessageId = (Date.now() + 1).toString();
    const aiMessage: ChatMessage = {
      id: aiMessageId,
      role: "assistant",
      content: "",
      isStreaming: true,
      editedFiles: [],
    };

    setMessages((prev) => [...prev, aiMessage]);

    const cleanup = api.streamChat(
      projectId,
      content,
      (chunk) => {
        // Append chunk to streaming message, reconstructing spaces between words in real-time if needed
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === aiMessageId) {
              const currentContent = msg.content;
              const needsSpace =
                currentContent &&
                /[a-zA-Z0-9.!?,;:]$/.test(currentContent) &&
                /^[a-zA-Z0-9+]/.test(chunk);
              const space = needsSpace ? " " : "";
              return { ...msg, content: currentContent + space + chunk, isStreaming: true };
            }
            return msg;
          })
        );
      },
      (path, fileContent) => {
        // Update file content
        setUpdatedFiles((prev) => new Map(prev).set(path, fileContent));

        // Track edited file
        if (!currentEditedFilesRef.current.includes(path)) {
          currentEditedFilesRef.current.push(path);
        }

        // Update the message with edited files
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, editedFiles: [...currentEditedFilesRef.current] }
              : msg
          )
        );
      },
      () => {
        // Stream complete
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, isStreaming: false, editedFiles: [...currentEditedFilesRef.current] }
              : msg
          )
        );
        setIsStreaming(false);
      },
      (error) => {
        // Handle error
        toast({
          title: "Chat error",
          description: error.message,
          variant: "destructive",
        });
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, content: "Sorry, an error occurred.", isStreaming: false }
              : msg
          )
        );
        setIsStreaming(false);
      }
    );

    return cleanup;
  }, [projectId, toast]);

  // Listen for runtime errors from the preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Security check: ensure message is from our expected source if possible
      // In local dev, origins might be localhost:5173 or localhost:8080

      const data = event.data;
      if (data?.type === 'PreviewError') {
        const error = data.payload;
        console.log("Caught runtime error:", error);
        setRuntimeError({
          message: error.message,
          source: data.subType,
          stack: error.stack,
          filename: error.source, // Map filename from payload source
          lineno: error.lineno,
          colno: error.colno,
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleFixError = useCallback((error: RuntimeError) => {
    const prompt = `I encountered a ${error.source || "runtime error"} in my application:
    
Error Message: ${error.message}
${error.filename ? `File: ${error.filename}` : ''}
${error.lineno ? `Line: ${error.lineno}` : ''}

Stack Trace:
${error.stack || "No stack trace available"}

Please analyze this error and fix the code to resolve it.`;

    handleSendMessage(prompt);
    setRuntimeError(null);
  }, [handleSendMessage]);

  const handleDeleteProject = async () => {
    if (!projectId) return;
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) return;

    try {
      await api.deleteProject(projectId);
      navigate("/projects");
      toast({ title: "Success", description: "Project deleted successfully" });
    } catch (error) {
      console.error("Failed to delete:", error);
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    }
  };

  const handleDownloadProject = async () => {
    if (!projectId) return;
    try {
      const blob = await api.downloadProjectZip(projectId);
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

  const openRenameDialog = () => {
    if (project) {
      setRenameName(project.name);
      setIsRenameDialogOpen(true);
    }
  };

  const handleRenameSubmit = async () => {
    if (!projectId || !renameName.trim()) return;

    try {
      const updated = await api.updateProject(projectId, renameName);
      setProject(prev => prev ? { ...prev, name: updated.name } : null);
      setIsRenameDialogOpen(false);
      toast({ title: "Success", description: "Project renamed successfully" });
    } catch (error) {
      console.error("Failed to rename:", error);
      toast({ title: "Error", description: "Failed to rename project", variant: "destructive" });
    }
  };

  if (!projectId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Invalid project ID</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="h-14 shrink-0 border-b border-border bg-panel/75 backdrop-blur-md flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          {project ? (
            <>
              <div
                className="w-8 h-8 rounded-lg shadow-sm border border-white/10"
                style={generateGradient(project.name)}
              />
              <span className="font-semibold text-sm font-display tracking-tight text-white">{project.name}</span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-sm font-display tracking-tight text-white">Loading...</span>
            </>
          )}
          <span className="text-muted-foreground/60 text-xs ml-2 border-l border-white/10 pl-3.5 hidden sm:inline-block">Previewing last saved version</span>
          {project?.role !== 'VIEWER' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 ml-2 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-card/95 border-white/5 backdrop-blur-md rounded-xl">
                <DropdownMenuItem onClick={openRenameDialog} className="rounded-lg">
                  <Edit className="w-4 h-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadProject} className="rounded-lg">
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem className="text-red-500 focus:text-red-500 rounded-lg" onClick={handleDeleteProject}>
                  <Trash className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/5 border border-white/5 rounded-xl p-1 mx-2">
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition-all rounded-lg ${viewMode === "preview"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              onClick={() => setViewMode("code")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition-all rounded-lg ${viewMode === "code"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Code className="w-3.5 h-3.5" />
              Code
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {project && (
            <div className="flex items-center gap-2.5 px-2.5 py-1 bg-white/5 rounded-xl border border-white/5">
              <Avatar className="h-6 w-6 border border-primary/20">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                  {(() => {
                    const userInfo = getUserInfo();
                    if (userInfo?.name) {
                      return userInfo.name.charAt(0).toUpperCase();
                    }
                    return "U";
                  })()}
                </AvatarFallback>
              </Avatar>
              {project.role && (
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md",
                  project.role === 'OWNER' ? "bg-primary/15 text-primary" :
                    project.role === 'EDITOR' ? "bg-amber-500/15 text-amber-500" :
                      "bg-white/5 text-muted-foreground"
                )}>
                  {project.role}
                </span>
              )}
            </div>
          )}

          <ShareDialog
            projectId={projectId}
            trigger={
              <Button variant="outline" size="sm" className="h-9 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 hover:text-white text-xs font-medium" disabled={project?.role === 'VIEWER'}>
                Share
              </Button>
            }
          />
          {project?.role !== 'VIEWER' && (
            <>
              <Button variant="outline" size="sm" className="h-9 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 hover:text-white text-xs" onClick={() => navigate("/pricing")}>
                Upgrade
              </Button>
              <Button size="sm" className="h-9 rounded-xl text-xs bg-primary hover:bg-primary/90 glow-effect font-medium">
                Publish
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-xl"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Chat Panel */}
          <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
            <div className="h-full border-r border-border/50 bg-panel">
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendMessage}
                isStreaming={isStreaming}
                isLoading={isLoadingHistory}
                readOnly={project?.role === 'VIEWER'}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-px bg-border/50 hover:bg-primary/50 transition-colors" />

          {/* Code/Preview Panel */}
          <ResizablePanel defaultSize={65} minSize={50} maxSize={75}>
            <div className="h-full">
              <div className="h-full relative">
                <div className={cn("h-full absolute inset-0", viewMode !== "code" && "hidden")}>
                  <CodePanel projectId={projectId} updatedFiles={updatedFiles} />
                </div>
                <div className={cn("h-full absolute inset-0", viewMode !== "preview" && "hidden")}>
                  <PreviewPanel
                    projectId={projectId}
                    runtimeError={runtimeError}
                    onDismiss={() => setRuntimeError(null)}
                    onFix={handleFixError}
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Project</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={renameName}
              onChange={(e) => setRenameName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRenameSubmit} disabled={!renameName.trim() || renameName === project?.name}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  );
}
