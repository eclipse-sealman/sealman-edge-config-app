import type { ReactNode } from "react";

interface DevicePanelProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function DevicePanel({ title, description, actions, children }: DevicePanelProps) {
  return (
    <section className="rounded-lg border bg-background shadow-xs">
      <header className="flex items-start justify-between gap-4 border-b px-6 py-4">
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      <div className="space-y-6 p-6">{children}</div>
    </section>
  );
}
