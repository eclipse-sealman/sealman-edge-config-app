import _AceEditor from "react-ace";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/mode-java";

// Vite 8 pre-bundles react-ace as CJS and exports module.exports as default,
// which is { __esModule: true, default: AceEditorClass, split, diff }.
// Unwrap the actual component here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AceEditor: typeof _AceEditor = (_AceEditor as any).default ?? _AceEditor;

interface JsonEditorProps {
  value: string,
  readOnly?: boolean,
  onChange?: (newValue: string) => void
}

export default function JsonEditor({value, onChange, readOnly}: JsonEditorProps) {
  return (
    <AceEditor
      mode="java"
      name="jsoneditor"
      onChange={onChange}
      fontSize={16}
      height="100%"
      width="100%"
      readOnly={readOnly}
      highlightActiveLine={true}
      value={value}
      setOptions={{
        showLineNumbers: true,
        tabSize: 2,
      }} />
  )
}