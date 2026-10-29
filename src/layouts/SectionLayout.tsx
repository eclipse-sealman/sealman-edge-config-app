import { NavLink, Outlet } from "react-router-dom";

export interface SectionTab {
  label: string;
  path: string;
}

/** Page frame with a titled sub-navigation on the left, shared by Platform Configuration and Authorization. */
export default function SectionLayout({ title, tabs }: { title: string; tabs: SectionTab[] }) {
  return (
    <div className="flex h-full gap-6 p-6">
      <nav aria-label={title} className="w-56 shrink-0 self-start rounded-lg border bg-background p-2">
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <div className="flex flex-col gap-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `rounded px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-100 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
