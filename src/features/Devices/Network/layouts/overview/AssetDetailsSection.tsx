import { useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actions?: ReactNode;
  children: ReactNode;
}

export default function AssetDetailsSection({ title, open, onOpenChange, actions, children }: Props) {
  const id = useId();
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2 py-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-sm text-xs font-semibold uppercase tracking-wide text-blue-700 focus-visible:outline-2 focus-visible:outline-ring"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => onOpenChange(!open)}
        >
          <ChevronDown aria-hidden="true" className={`h-4 w-4 transition-transform ${open ? "" : "-rotate-90"}`} />
          {title}
        </button>
        {actions && <div className="ml-auto flex w-48 max-w-full flex-wrap items-center justify-end gap-2">{actions}</div>}
      </div>
      <div id={id} hidden={!open} className="pb-4">
        {children}
      </div>
    </section>
  );
}
