import type { ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { WaterLoader } from "@/components/ui/water-loader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ALERT_STYLES = {
  error: { box: "border-red-200 bg-red-50 text-red-700", Icon: AlertCircle },
  warning: { box: "border-amber-200 bg-amber-50 text-amber-800", Icon: AlertTriangle },
  info: { box: "border-blue-200 bg-blue-50 text-blue-800", Icon: Info },
  success: { box: "border-green-200 bg-green-50 text-green-700", Icon: CheckCircle2 },
} as const;

export type InlineAlertVariant = keyof typeof ALERT_STYLES;

/** Compact, consistent message box for errors, warnings, hints and confirmations inside a page or dialog. */
export function InlineAlert({
  variant = "error",
  children,
  className,
  action,
}: {
  variant?: InlineAlertVariant;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  const { box, Icon } = ALERT_STYLES[variant];
  return (
    <div role={variant === "error" ? "alert" : "status"} className={cn("flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm", box, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 break-words">{children}</div>
      {action}
    </div>
  );
}

/** Water loader with a label, used wherever data is still being fetched. */
export function LoadingState({ label = "Loading...", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 p-6 text-sm text-muted-foreground", className)} role="status">
      <WaterLoader className="h-8 w-8" />
      {label}
    </div>
  );
}

/** Centered error panel with an optional retry action, used when a page or section could not be loaded. */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 p-8 text-center", className)} role="alert">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold">{title}</p>
        {message && <p className="max-w-md text-sm text-muted-foreground">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
