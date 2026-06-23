import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Lightbulb, 
  Database, 
  FileEdit,
  Loader2, 
  FileCode,
  FileJson,
  FileText,
  File
} from 'lucide-react';
import { ChatEvent, ChatEventType } from '@/lib/types';

function getFileIcon(path: string) {
  const ext = path.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
      return <FileCode className="w-3.5 h-3.5 mr-1.5 text-blue-400 shrink-0" />;
    case 'json':
      return <FileJson className="w-3.5 h-3.5 mr-1.5 text-yellow-500 shrink-0" />;
    case 'css':
      return <FileCode className="w-3.5 h-3.5 mr-1.5 text-pink-400 shrink-0" />;
    case 'md':
      return <FileText className="w-3.5 h-3.5 mr-1.5 text-emerald-400 shrink-0" />;
    default:
      return <File className="w-3.5 h-3.5 mr-1.5 text-muted-foreground shrink-0" />;
  }
}

export const ChatEventRenderer = ({ 
  event, 
  isLoading, 
  onSelectFile 
}: { 
  event: ChatEvent, 
  isLoading?: boolean, 
  onSelectFile?: (path: string) => void 
}) => {
  switch (event.type) {
    case ChatEventType.THOUGHT:
      return (
        <div className="flex items-center gap-2 text-[#949494] text-[13px] font-normal mb-4">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
          <span>{event.content}</span>
        </div>
      );

    case ChatEventType.TOOL_LOG:
      return <CollapsibleEvent 
                icon={<Database className="w-4 h-4" />} 
                label="Read" 
                event={event} 
                onSelectFile={onSelectFile}
              />;

    case ChatEventType.FILE_EDIT:
     return <CollapsibleEvent 
                icon={isLoading ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <FileEdit className="w-4 h-4" />} 
                label={isLoading ? "Editing" : "Edited"} 
                event={event} 
                hideToggle 
                forceSingleLine={isLoading} // Keep it simple while loading
                onSelectFile={onSelectFile}
              />;

    case ChatEventType.MESSAGE:
      return (
        <div className="prose prose-invert prose-sm max-w-none text-[#ececec] leading-relaxed mb-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {event.content}
          </ReactMarkdown>
          {isLoading && <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-pulse align-middle" />}
        </div>
      );

    default:
      return null;
  }
};

const CollapsibleEvent = ({ 
  icon, 
  label, 
  event,
  hideToggle = false,
  forceSingleLine = false,
  onSelectFile
}: { 
  icon: React.ReactNode, 
  label: string, 
  event: ChatEvent,
  hideToggle?: boolean,
  forceSingleLine?: boolean,
  onSelectFile?: (path: string) => void
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Parse files
  const files = event.type === ChatEventType.FILE_EDIT 
    ? [event.filePath].filter(Boolean) as string[]
    : (event.metadata?.split(',') || []).filter(Boolean).map(f => f.trim());

  if (files.length === 0) return null;

  const hasMultipleFiles = files.length > 1;
  const showButton = !hideToggle && hasMultipleFiles && !forceSingleLine;

  return (
    <div className="flex flex-col gap-2 my-2">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <div className="text-[#949494] shrink-0">{icon}</div>
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="text-[#949494] text-[13px] font-medium shrink-0">{label}</span>
            
            {/* File Name Badge - Clickable Button */}
            <button
              onClick={() => onSelectFile?.(files[0])}
              className="inline-flex items-center bg-[#222] hover:bg-primary/10 border border-[#333] hover:border-primary/40 text-[#ececec] hover:text-primary text-[12px] px-2.5 py-0.5 rounded-md font-mono truncate transition-all duration-200 cursor-pointer active:scale-95 shadow-sm hover:shadow-[0_0_10px_rgba(59,130,246,0.15)]"
              title={`Open ${files[0]}`}
            >
              {getFileIcon(files[0])}
              <span>{files[0].split('/').pop()}</span>
            </button>

            {/* +X more logic */}
            {!isExpanded && hasMultipleFiles && (
              <span className="text-[#949494] text-[11px] whitespace-nowrap">
                +{files.length - 1} more
              </span>
            )}
          </div>
        </div>
        
        {showButton && (
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[#949494] hover:text-[#ececec] text-[12px] font-medium bg-[#1a1a1a] px-2 py-0.5 rounded border border-[#333] transition-colors ml-4"
          >
            {isExpanded ? 'Hide' : 'Show'}
          </button>
        )}
      </div>

      {/* List expansion logic */}
      {isExpanded && hasMultipleFiles && !forceSingleLine && (
        <div className="flex flex-col gap-2">
          {files.slice(1).map((file, idx) => (
            <div key={idx} className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
               <div className="text-[#949494] shrink-0 opacity-0">{icon}</div> {/* Invisible spacer icon */}
               <span className="text-[#949494] text-[13px] font-medium w-8 shrink-0">{label}</span>
               {/* Clickable File Name Badge */}
               <button
                 onClick={() => onSelectFile?.(file)}
                 className="inline-flex items-center bg-[#222] hover:bg-primary/10 border border-[#333] hover:border-primary/40 text-[#ececec] hover:text-primary text-[12px] px-2.5 py-0.5 rounded-md font-mono truncate transition-all duration-200 cursor-pointer active:scale-95 shadow-sm hover:shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                 title={`Open ${file}`}
               >
                 {getFileIcon(file)}
                 <span>{file.split('/').pop()}</span>
               </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};