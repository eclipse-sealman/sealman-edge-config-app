import { useId, useMemo, useRef } from "react";
import _AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/mode-yaml";
import "ace-builds/src-noconflict/ext-searchbox";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { yamlProblems } from "./yamlProblem";

// See JsonEditor: react-ace is pre-bundled as CJS, so the component sits on `.default`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AceEditor: typeof _AceEditor = (_AceEditor as any).default ?? _AceEditor;

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
  /** Sizes the editor, e.g. "h-72". */
  className?: string;
  label?: string;
}

/** YAML editor with highlighting and live syntax check (gutter marks plus a status line to jump to the first error). */
export default function YamlEditor({ value, onChange, className, label = "YAML editor" }: YamlEditorProps) {
  const id = useId();
  const ace = useRef<{ editor: { focus(): void; gotoLine(line: number, column?: number, animate?: boolean): void } } | null>(null);
  const problems = useMemo(() => yamlProblems(value), [value]);
  const first = problems[0];
  const blank = value.trim() === "";

  const annotations = useMemo(
    () => problems.map((p) => ({ row: p.line - 1, column: p.column - 1, type: "error", text: p.message })),
    [problems],
  );

  const jumpToProblem = () => {
    if (!first || !ace.current) return;
    ace.current.editor.focus();
    ace.current.editor.gotoLine(first.line, first.column - 1, true);
  };

  return (
    <div role="group" aria-label={label} className={cn("flex flex-col overflow-hidden rounded-md border bg-background", className)}>
      <div className="flex shrink-0 items-center gap-2 border-b bg-muted/40 px-3 py-1.5 text-xs">
        {first ? (
          <button
            type="button"
            onClick={jumpToProblem}
            title="Jump to the error"
            className="flex min-w-0 items-center gap-1.5 text-left text-red-700 hover:underline"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              Line {first.line}, column {first.column}: {first.message}
              {problems.length > 1 && ` (+${problems.length - 1} more)`}
            </span>
          </button>
        ) : blank ? (
          <span className="text-muted-foreground">Empty</span>
        ) : (
          <span className="flex items-center gap-1.5 text-green-700">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> Valid YAML
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1">
        <AceEditor
          ref={ace as never}
          mode="yaml"
          name={`yaml-editor-${id.replace(/:/g, "")}`}
          onChange={onChange}
          fontSize={14}
          height="100%"
          width="100%"
          annotations={annotations}
          highlightActiveLine={true}
          value={value}
          setOptions={{ showLineNumbers: true, tabSize: 2, useWorker: false, useSoftTabs: true }}
        />
      </div>
    </div>
  );
}
