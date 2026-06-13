import { useState } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Braces, 
  FileText, 
  Image, 
  Zap, 
  Atom, 
  Lock, 
  Settings, 
  GitBranch 
} from "lucide-react";
import { FileNode } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface FileTreeProps {
  files: FileNode[];
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  isLoading?: boolean;
}

const getFileIcon = (name: string) => {
  const lowerName = name.toLowerCase();
  
  if (lowerName === "vite.config.ts" || lowerName === "vite.config.js") {
    return () => <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400/20 shrink-0" />;
  }
  if (lowerName.includes("router")) {
    return () => <Atom className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
  }
  if (lowerName.includes("lock") || lowerName.includes("lockb")) {
    return () => <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
  }
  if (lowerName.startsWith(".git")) {
    return () => <GitBranch className="w-3.5 h-3.5 text-orange-500 shrink-0" />;
  }
  if (lowerName.includes("config") || lowerName.startsWith(".")) {
    return () => <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }

  const ext = name.split(".").pop()?.toLowerCase();
  
  switch (ext) {
    case "ts":
    case "tsx":
      return () => (
        <span className="text-[8px] font-bold bg-[#1d4ed8]/10 text-blue-400 px-1 py-0.5 rounded border border-blue-500/25 leading-none shrink-0 font-mono scale-90 origin-center">
          TS
        </span>
      );
    case "js":
    case "jsx":
      return () => (
        <span className="text-[8px] font-bold bg-[#eab308]/10 text-yellow-500 px-1 py-0.5 rounded border border-yellow-500/25 leading-none shrink-0 font-mono scale-90 origin-center">
          JS
        </span>
      );
    case "css":
    case "scss":
      return () => (
        <span className="text-[8px] font-bold bg-[#db2777]/10 text-pink-400 px-1 py-0.5 rounded border border-pink-500/25 leading-none shrink-0 font-mono scale-90 origin-center">
          CSS
        </span>
      );
    case "json":
      return () => <Braces className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    case "md":
    case "txt":
      return () => <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "svg":
    case "gif":
      return () => <Image className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    default:
      return () => <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
  }
};

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  selectedPath: string | null;
  onSelectFile: (path: string) => void;
  searchActive: boolean;
}

function FileTreeItem({ node, depth, selectedPath, onSelectFile, searchActive }: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  
  const expanded = searchActive ? true : isExpanded;
  const isDirectory = node.type === "directory";
  const isSelected = selectedPath === node.path;
  const FileIcon = isDirectory ? null : getFileIcon(node.name);

  const handleClick = () => {
    if (isDirectory) {
      setIsExpanded(!isExpanded);
    } else {
      onSelectFile(node.path);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "file-tree-item flex items-center gap-2 px-2 py-1 rounded-md cursor-pointer transition-all duration-150 mx-1.5 my-0.5",
          isSelected 
            ? "bg-primary/10 text-primary-foreground font-medium border-l-2 border-primary pl-1" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/20"
        )}
        style={{ paddingLeft: `${depth * 14 + (isSelected ? 6 : 8)}px` }}
        onClick={handleClick}
      >
        {isDirectory ? (
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/70" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/70" />
            )}
          </div>
        ) : (
          <div className="w-4 h-4 flex items-center justify-center shrink-0">
            {FileIcon && <FileIcon />}
          </div>
        )}
        <span className="truncate text-[13px] leading-none py-1 select-none">{node.name}</span>
      </div>
      
      {isDirectory && expanded && node.children && (
        <div className="relative">
          {/* Vertical indentation line matching VS Code layout */}
          <div 
            className="absolute top-0 bottom-0 w-[1px] bg-border/20" 
            style={{ left: `${depth * 14 + 15}px` }}
          />
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              searchActive={searchActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileTree({ files, selectedPath, onSelectFile, isLoading }: FileTreeProps) {
  const [search, setSearch] = useState("");

  if (isLoading) {
    return (
      <div className="p-4 space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2 animate-pulse">
            <div className="w-4 h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded flex-1" style={{ width: `${50 + i * 10}%` }} />
          </div>
        ))}
      </div>
    );
  }

  // Recursive search filter helper
  const filterTree = (nodes: FileNode[], query: string): FileNode[] => {
    if (!query) return nodes;
    const lowerQuery = query.toLowerCase();
    
    return nodes
      .map((node) => {
        if (node.type === "directory") {
          const filteredChildren = filterTree(node.children || [], query);
          const matchesDir = node.name.toLowerCase().includes(lowerQuery);
          if (matchesDir || filteredChildren.length > 0) {
            return { ...node, children: filteredChildren };
          }
        } else {
          if (node.name.toLowerCase().includes(lowerQuery)) {
            return node;
          }
        }
        return null;
      })
      .filter(Boolean) as FileNode[];
  };

  const filteredFiles = filterTree(files, search);

  return (
    <div className="flex flex-col h-full">
      {/* Search Input Box */}
      <div className="px-3 py-2 shrink-0 border-b border-border/30 bg-panel">
        <Input
          type="text"
          placeholder="Search code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 bg-muted/30 border-border/30 text-xs focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0 focus:border-primary/50 placeholder:text-muted-foreground/40 rounded-md"
        />
      </div>

      {/* Tree Items List */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredFiles.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-xs select-none">
            {search ? "No matching files" : "No files yet"}
          </div>
        ) : (
          filteredFiles.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              onSelectFile={onSelectFile}
              searchActive={search.length > 0}
            />
          ))
        )}
      </div>
    </div>
  );
}
