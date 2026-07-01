import { useState, useEffect, useCallback, useRef } from "react";
import { FileTree } from "./FileTree";
import { CodeEditor } from "./CodeEditor";
import { FileTabs } from "./FileTabs";
import { api, FileNode, OPEN_TABS_KEY, ACTIVE_TAB_KEY } from "@/lib/api";

interface CodePanelProps {
  projectId: string;
  updatedFiles: Map<string, string>;
  activeFile?: string | null;
  onActiveTabChange?: (path: string | null) => void;
  isStreaming?: boolean;
}

// Helper to find a file by path in the tree
function findFileInTree(files: FileNode[], targetPath: string): boolean {
  for (const node of files) {
    if (node.path === targetPath) return true;
    if (node.children && findFileInTree(node.children, targetPath)) return true;
  }
  return false;
}

// Storage key helpers
const getTabsKey = (projectId: string) => `${OPEN_TABS_KEY}_${projectId}`;
const getActiveTabKey = (projectId: string) => `${ACTIVE_TAB_KEY}_${projectId}`;

export function CodePanel({ projectId, updatedFiles, activeFile, onActiveTabChange, isStreaming }: CodePanelProps) {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isLoadingTree, setIsLoadingTree] = useState(true);
  const [isLoadingFile, setIsLoadingFile] = useState(false);

  // Synchronize activeFile prop with local tabs state
  useEffect(() => {
    if (activeFile) {
      setOpenTabs((prev) => {
        if (!prev.includes(activeFile)) {
          return [...prev, activeFile];
        }
        return prev;
      });
      setActiveTab(activeFile);
    }
  }, [activeFile]);

  // Load tabs from localStorage
  useEffect(() => {
    const savedTabs = localStorage.getItem(getTabsKey(projectId));
    const savedActiveTab = localStorage.getItem(getActiveTabKey(projectId));

    if (savedTabs) {
      try {
        const tabs = JSON.parse(savedTabs);
        if (Array.isArray(tabs) && tabs.length > 0) {
          setOpenTabs(tabs);
          setActiveTab(savedActiveTab || tabs[0]);
          return;
        }
      } catch (e) {
        console.error("Failed to parse saved tabs:", e);
      }
    }
  }, [projectId]);

  // Save tabs to localStorage whenever they change
  useEffect(() => {
    if (openTabs.length > 0) {
      localStorage.setItem(getTabsKey(projectId), JSON.stringify(openTabs));
    } else {
      localStorage.removeItem(getTabsKey(projectId));
    }
  }, [openTabs, projectId]);

  // Save active tab to localStorage and notify parent
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem(getActiveTabKey(projectId), activeTab);
    } else {
      localStorage.removeItem(getActiveTabKey(projectId));
    }
    onActiveTabChange?.(activeTab);
  }, [activeTab, projectId, onActiveTabChange]);

  const loadFiles = useCallback(async (shouldSetDefaultTab = false) => {
    setIsLoadingTree(true);
    try {
      const fileTree = await api.getFiles(projectId);
      setFiles(fileTree);

      // Filter out any open tabs that no longer exist in the file tree
      setOpenTabs((currentOpenTabs) => {
        let updatedTabs = currentOpenTabs;
        if (!shouldSetDefaultTab) {
          updatedTabs = currentOpenTabs.filter((tabPath) => findFileInTree(fileTree, tabPath));
          
          setActiveTab((currentActiveTab) => {
            if (currentActiveTab && !updatedTabs.includes(currentActiveTab)) {
              return updatedTabs.length > 0 ? updatedTabs[0] : null;
            }
            return currentActiveTab;
          });
        }

        if (shouldSetDefaultTab && updatedTabs.length === 0) {
          const defaultPaths = ["src/pages/Index.tsx", "pages/Index.tsx"];
          for (const defaultPath of defaultPaths) {
            if (findFileInTree(fileTree, defaultPath)) {
              setActiveTab(defaultPath);
              return [defaultPath];
            }
          }
        }

        return updatedTabs;
      });
    } catch (error) {
      console.error("Failed to load files:", error);
    } finally {
      setIsLoadingTree(false);
    }
  }, [projectId]);

  // Load file tree on project change
  useEffect(() => {
    loadFiles(true);
  }, [projectId, loadFiles]);

  const wasStreamingRef = useRef(false);

  // Reload file tree when streaming finishes
  useEffect(() => {
    if (wasStreamingRef.current && !isStreaming) {
      loadFiles(false);
    }
    wasStreamingRef.current = isStreaming ?? false;
  }, [isStreaming, loadFiles]);

  const updatedFilesRef = useRef(updatedFiles);
  useEffect(() => {
    updatedFilesRef.current = updatedFiles;
  }, [updatedFiles]);

  // Load file content when active tab changes
  useEffect(() => {
    if (!activeTab) {
      setFileContent("");
      return;
    }

    // Check if we have an updated version from streaming
    if (updatedFilesRef.current.has(activeTab)) {
      setFileContent(updatedFilesRef.current.get(activeTab)!);
      return;
    }

    const loadContent = async () => {
      setIsLoadingFile(true);
      try {
        const content = await api.getFileContent(projectId, activeTab);
        setFileContent(content);
      } catch (error) {
        console.error("Failed to load file:", error);
        setFileContent("// Error loading file");
      } finally {
        setIsLoadingFile(false);
      }
    };

    loadContent();
  }, [projectId, activeTab]);

  // Update content when streaming updates arrive for active file
  useEffect(() => {
    if (activeTab && updatedFiles.has(activeTab)) {
      setFileContent(updatedFiles.get(activeTab)!);
    }
  }, [activeTab, updatedFiles]);

  const handleSelectFile = useCallback((path: string) => {
    // Add to tabs if not already open
    if (!openTabs.includes(path)) {
      setOpenTabs((prev) => [...prev, path]);
    }
    setActiveTab(path);
  }, [openTabs]);

  const handleCloseTab = useCallback((path: string) => {
    setOpenTabs((prev) => {
      const newTabs = prev.filter((t) => t !== path);

      // If closing active tab, switch to another tab
      if (activeTab === path) {
        const closingIndex = prev.indexOf(path);
        const newActiveIndex = Math.min(closingIndex, newTabs.length - 1);
        setActiveTab(newTabs[newActiveIndex] || null);
      }

      return newTabs;
    });
  }, [activeTab]);

  const handleSelectTab = useCallback((path: string) => {
    setActiveTab(path);
  }, []);

  return (
    <div className="flex h-full">
      {/* File Tree */}
      <div className="w-56 shrink-0 border-r border-border/50 flex flex-col bg-panel">
        <div className="panel-header shrink-0">
          <span className="text-sm font-medium">Files</span>
        </div>
        <div className="flex-1 min-h-0">
          <FileTree
            files={files}
            selectedPath={activeTab}
            onSelectFile={handleSelectFile}
            isLoading={isLoadingTree}
          />
        </div>
      </div>

      {/* Code Editor with Tabs */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* File Tabs */}
        <FileTabs
          openTabs={openTabs}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          onCloseTab={handleCloseTab}
        />

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            content={fileContent}
            filePath={activeTab}
            isLoading={isLoadingFile}
          />
        </div>
      </div>
    </div>
  );
}
