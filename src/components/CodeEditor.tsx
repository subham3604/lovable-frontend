import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { css } from '@codemirror/lang-css';
import { FileCode, Loader2 } from "lucide-react";
import { githubDark } from '@uiw/codemirror-theme-github';

// Custom theme extension to match CodeMirror to the charcoal dashboard theme (#0d0d11)
const charcoalEditorTheme = EditorView.theme({
  "&": {
    backgroundColor: "#0d0d11 !important",
    color: "#e2e8f0 !important"
  },
  ".cm-scroller": {
    fontFamily: "var(--font-mono, JetBrains Mono, Fira Code, monospace) !important",
    fontSize: "13px"
  },
  ".cm-content": {
    caretColor: "#ffffff"
  },
  ".cm-cursor, .cm-dropCursor": {
    borderLeftColor: "#ffffff"
  },
  "&.cm-focused .cm-cursor": {
    borderLeftColor: "#ffffff"
  },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "rgba(255, 255, 255, 0.1) !important"
  },
  ".cm-gutters": {
    backgroundColor: "#0d0d11 !important",
    color: "#475569 !important",
    borderRight: "1px solid rgba(255, 255, 255, 0.04) !important"
  },
  ".cm-activeLine": {
    backgroundColor: "rgba(255, 255, 255, 0.02) !important"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "rgba(255, 255, 255, 0.02) !important",
    color: "#94a3b8 !important"
  }
}, { dark: true });

interface CodeEditorProps {
  content: string;
  filePath: string | null;
  isLoading?: boolean;
  onCodeChange?: (newCode: string) => void;
}

export function CodeEditor({ content, filePath, isLoading, onCodeChange }: CodeEditorProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!filePath) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <FileCode className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium">No file selected</h3>
      </div>
    );
  }

  // Auto-detect language extension
  const getLanguage = (path: string) => {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return [javascript({ jsx: true, typescript: true })];
      case 'json':
        return [json()];
      case 'css':
      case 'scss':
        return [css()];
      case 'html':
      case 'svg':
        return [javascript({ jsx: true })];
      default:
        return [];
    }
  };

  return (
    <div className="h-full w-full overflow-hidden border-l">
      <CodeMirror
        value={content}
        height="100%"
        theme={githubDark}
        editable={false}
        extensions={[...getLanguage(filePath), charcoalEditorTheme]}
        onChange={(value) => onCodeChange?.(value)}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
        }}
        className="text-sm h-full"
      />
    </div>
  );
}