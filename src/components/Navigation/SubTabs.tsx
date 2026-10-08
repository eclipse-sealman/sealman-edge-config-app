import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SubTabsProps<T extends string> {
  tabs: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  /** Rendered at the right end of the tab bar, visible on every tab. */
  actions?: ReactNode;
}

export default function SubTabs<T extends string>({ tabs, active, onChange, actions }: SubTabsProps<T>) {
  return (
    <div className="flex items-end justify-between gap-4 border-b">
      <div role="tablist" className="flex min-w-0 gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              active === tab.id
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {actions && <div className="shrink-0 pb-1.5">{actions}</div>}
    </div>
  );
}
