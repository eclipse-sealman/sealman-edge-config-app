import { Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionStatus {
  iotEdgeRuntime: string;
  iotHub: string;
  sems: string;
  vpn?: string;
}

type Tone = "online" | "partial" | "offline" | "unknown";

const TONES: Record<Tone, { label: string; accent: string; wash: string; icon: string; pill: string; dot: string }> = {
  online: {
    label: "Online",
    accent: "bg-green-500",
    wash: "from-green-50",
    icon: "bg-green-100 text-green-600",
    pill: "border-green-200 bg-green-50 text-green-700",
    dot: "bg-green-500",
  },
  partial: {
    label: "Partially connected",
    accent: "bg-amber-500",
    wash: "from-amber-50",
    icon: "bg-amber-100 text-amber-600",
    pill: "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },
  offline: {
    label: "Offline",
    accent: "bg-red-500",
    wash: "from-red-50",
    icon: "bg-red-100 text-red-600",
    pill: "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },
  unknown: {
    label: "Unknown",
    accent: "bg-slate-400",
    wash: "from-slate-50",
    icon: "bg-slate-100 text-slate-500",
    pill: "border-slate-200 bg-slate-50 text-slate-600",
    dot: "bg-slate-400",
  },
};

function getTone(status?: ConnectionStatus): Tone {
  if (!status) return "unknown";
  const states = [status.iotEdgeRuntime, status.iotHub, status.sems];
  if (states.every((state) => state === "Connected")) return "online";
  if (states.every((state) => state === "Disconnected")) return "offline";
  return "partial";
}

function ConnectionChip({ label, connected }: { label: string; connected: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className={cn("h-2 w-2 rounded-full", connected ? "bg-green-500" : "bg-red-500")} />
      {label}
    </span>
  );
}

interface DeviceHeaderProps {
  deviceId?: string;
  connectionStatus?: ConnectionStatus;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
}

export default function DeviceHeader({ deviceId, connectionStatus, isLoading, isError, error }: DeviceHeaderProps) {
  const tone = TONES[getTone(connectionStatus)];

  return (
    <div
      className={cn(
        "relative flex shrink-0 flex-wrap items-center gap-x-5 gap-y-3 overflow-hidden rounded-xl border bg-linear-to-r via-white to-white py-4 pl-6 pr-5 shadow-xs",
        tone.wash,
      )}
    >
      <div className={cn("absolute inset-y-0 left-0 w-1.5", tone.accent)} />

      <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", tone.icon)}>
        <Cpu className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Device</div>
        <h1 className="truncate text-2xl font-semibold leading-tight tracking-tight">{deviceId}</h1>
      </div>

      {isLoading ? (
        <div className="h-8 w-56 animate-pulse rounded-full bg-muted" />
      ) : isError ? (
        <span className="text-sm text-destructive">Error: {String(error)}</span>
      ) : (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {connectionStatus && (
            <div className="flex items-center gap-3">
              <ConnectionChip label="Runtime" connected={connectionStatus.iotEdgeRuntime === "Connected"} />
              <ConnectionChip label="IoT Hub" connected={connectionStatus.iotHub === "Connected"} />
              <ConnectionChip label="Smart-EMS" connected={connectionStatus.sems === "Connected"} />
              {connectionStatus.vpn !== undefined && (
                <ConnectionChip label="VPN" connected={connectionStatus.vpn === "Connected"} />
              )}
            </div>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold",
              tone.pill,
            )}
          >
            <span className="relative flex h-2.5 w-2.5">
              {tone.label === "Online" && (
                <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", tone.dot)} />
              )}
              <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", tone.dot)} />
            </span>
            {tone.label}
          </span>
        </div>
      )}
    </div>
  );
}
