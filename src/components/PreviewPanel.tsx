import { useState, useEffect } from "react";
import { Play, Loader2, ExternalLink, RefreshCw, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, PREVIEW_URL_KEY } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

import { RuntimeErrorAlert, RuntimeError } from "@/components/RuntimeErrorAlert";

interface PreviewPanelProps {
  projectId: string;
  runtimeError: RuntimeError | null;
  onDismiss: () => void;
  onFix: (error: RuntimeError) => void;
}

export function PreviewPanel({ projectId, runtimeError, onDismiss, onFix }: PreviewPanelProps) {
  const previewUrlKey = `preview_url_${projectId}`;
  const [previewUrl, setPreviewUrl] = useState<string | null>(() => {
    // Load from localStorage on mount as a fallback/initial state
    return localStorage.getItem(previewUrlKey);
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const { toast } = useToast();

  // Check preview deployment status on mount or project switch
  useEffect(() => {
    let active = true;
    setIsCheckingStatus(true);

    const checkStatus = async () => {
      try {
        const response = await api.getPreviewStatus(projectId);
        if (active) {
          if (response.deployed) {
            const cachedUrl = localStorage.getItem(previewUrlKey);
            setPreviewUrl(cachedUrl);
          } else {
            // Not deployed anymore, clear the expired URL
            setPreviewUrl(null);
            localStorage.removeItem(previewUrlKey);
          }
        }
      } catch (error) {
        console.error("Failed to check preview status:", error);
        // Fallback to null on failure
        if (active) {
          setPreviewUrl(null);
          localStorage.removeItem(previewUrlKey);
        }
      } finally {
        if (active) {
          setIsCheckingStatus(false);
        }
      }
    };

    checkStatus();

    return () => {
      active = false;
    };
  }, [projectId, previewUrlKey]);

  // Store previewUrl in localStorage when it changes
  useEffect(() => {
    if (previewUrl) {
      localStorage.setItem(previewUrlKey, previewUrl);
    } else {
      localStorage.removeItem(previewUrlKey);
    }
  }, [previewUrl, previewUrlKey]);

  const handleDeploy = async () => {
    setIsDeploying(true);

    try {
      const response = await api.deploy(projectId);
      setPreviewUrl(response.previewUrl);
      toast({
        title: "Deployment successful",
        description: "Your preview is now ready",
      });
    } catch (error) {
      toast({
        title: "Deployment failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRefresh = () => {
    const iframe = document.querySelector("iframe");
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* URL Bar */}
      <div className="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-border/50 bg-panel">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={!previewUrl || isDeploying || isCheckingStatus}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex-1 flex items-center h-8 px-3 rounded-md bg-muted/50 text-sm text-muted-foreground">
          <Globe className="w-3.5 h-3.5 mr-2 shrink-0" />
          <span className="truncate">
            {isCheckingStatus
              ? "Checking status..."
              : isDeploying
              ? "Deploying project..."
              : (previewUrl || "Click 'Run Preview' to deploy")}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {previewUrl && !isDeploying && !isCheckingStatus && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.open(previewUrl, "_blank")}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            onClick={handleDeploy}
            disabled={isDeploying || isCheckingStatus}
            size="sm"
            className="h-7 px-3 bg-primary hover:bg-primary/90 text-xs font-medium"
          >
            {isDeploying ? (
              <>
                <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                Deploying
              </>
            ) : (
              <>
                <Play className="w-3 h-3 mr-1.5" />
                Run Preview
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 bg-[#1a1a1a] relative overflow-hidden">
        {isCheckingStatus ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
            <Loader2 className="w-8 h-8 animate-spin text-primary/75 mb-4" />
            <p className="text-sm text-muted-foreground">Checking preview status...</p>
          </div>
        ) : isDeploying ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Globe className="w-8 h-8 text-primary animate-pulse" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Deploying your project...</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Setting up your preview environment and installing dependencies. This may take a minute.
            </p>
          </div>
        ) : previewUrl ? (
          <iframe
            src={previewUrl}
            className="w-full h-full border-0"
            title="Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-muted/10 border border-white/5 flex items-center justify-center mb-4 shadow-inner">
              <Globe className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-sm font-semibold text-white mb-1.5">Preview is not available</h3>
            <p className="text-xs text-muted-foreground max-w-xs mb-5">
              Deploy this project to see a live preview of your web application.
            </p>
            <Button
              onClick={handleDeploy}
              size="sm"
              className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-300"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Deploy Project
            </Button>
          </div>
        )}
      </div>

      {/* Error Alert Overlay - Inside the Preview Panel */}
      <RuntimeErrorAlert
        error={runtimeError}
        onDismiss={onDismiss}
        onFix={onFix}
      />
    </div>
  );
}
