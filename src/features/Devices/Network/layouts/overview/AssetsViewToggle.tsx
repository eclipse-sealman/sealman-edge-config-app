import { LayoutGrid, List } from "lucide-react";
import { AssetsViewMode } from "./canvasLayout";

const OPTIONS: { mode: AssetsViewMode; label: string; Icon: typeof List }[] = [
  { mode: "list", label: "List", Icon: List },
  { mode: "canvas", label: "Canvas", Icon: LayoutGrid },
];

/** Switches the Assets page between the list (accordion) view and the free-form canvas view. */
export default function AssetsViewToggle({ value, onChange }: { value: AssetsViewMode; onChange: (mode: AssetsViewMode) => void }) {
  return (
    <div role="group" aria-label="Assets view" className="inline-flex rounded-lg bg-muted p-1 text-sm font-medium text-muted-foreground">
      {OPTIONS.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          type="button"
          aria-pressed={value === mode}
          onClick={() => onChange(mode)}
          className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring ${
            value === mode ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </button>
      ))}
    </div>
  );
}
