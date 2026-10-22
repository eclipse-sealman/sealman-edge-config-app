import { Cloud, Cpu, Router, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { components } from "@/generated/edge-administration/types";
import { getErrorMessage } from "@/lib/errors";

type DeviceDetailConnectionStatus = components["schemas"]["DeviceDetailConnectionStatus"];

interface DeviceHeaderProps {
  deviceId?: string;
  connectionStatus?: DeviceDetailConnectionStatus;
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
}

interface StatusIconProps {
  label: string;
  state?: string;
  icon: ComponentType<{ className?: string }>;
}

function StatusIcon({ label, state, icon: Icon }: StatusIconProps) {
  const connected = state === "Connected";
  const text = `${label}: ${connected ? "Connected" : "Disconnected"}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={text}
          className={`flex h-8 w-8 items-center justify-center rounded-full border ${
            connected
              ? "border-green-200 bg-green-50 text-green-600"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  );
}

type HeaderState = "online" | "offline" | "partial" | "unknown";

function overallState(status?: DeviceDetailConnectionStatus): HeaderState {
  if (!status) return "unknown";
  const states = [status.iotEdgeRuntime, status.iotHub, status.sems];
  if (states.every((s) => s === "Connected")) return "online";
  if (states.every((s) => s === "Disconnected")) return "offline";
  return "partial";
}

const STATE_STYLE: Record<HeaderState, { label: string; tint: string; dot: string; chip: string; sweep: string }> = {
  online: {
    label: "Online",
    tint: "from-green-50 via-transparent",
    dot: "bg-green-500",
    chip: "border-green-200 bg-green-50 text-green-700",
    sweep: "via-green-300/30",
  },
  offline: {
    label: "Offline",
    tint: "from-red-50 via-transparent",
    dot: "bg-red-500",
    chip: "border-red-200 bg-red-50 text-red-700",
    sweep: "",
  },
  partial: {
    label: "Degraded",
    tint: "from-yellow-50 via-transparent",
    dot: "bg-yellow-500",
    chip: "border-yellow-200 bg-yellow-50 text-yellow-700",
    sweep: "",
  },
  unknown: {
    label: "Unknown",
    tint: "from-slate-50 via-transparent",
    dot: "bg-slate-400",
    chip: "border-slate-200 bg-slate-50 text-slate-600",
    sweep: "",
  },
};

function StatusOrb({ state }: { state: HeaderState }) {
  const { dot } = STATE_STYLE[state];
  return (
    <span className="relative flex h-3 w-3 shrink-0" aria-hidden="true">
      {state === "online" && (
        <span className={`absolute inline-flex h-full w-full rounded-full ${dot} opacity-60 motion-safe:animate-ping`} />
      )}
      <span
        className={`relative inline-flex h-3 w-3 rounded-full ${dot} ${
          state === "offline" || state === "partial" ? "motion-safe:animate-breathe" : ""
        }`}
      />
    </span>
  );
}

export default function DeviceHeader({ deviceId, connectionStatus, isLoading, isError, error }: DeviceHeaderProps) {
  const state = overallState(connectionStatus);
  const style = STATE_STYLE[state];

  return (
    <div className="relative flex items-center gap-4 overflow-hidden rounded-lg border bg-white px-5 py-3">
      <div className={`pointer-events-none absolute inset-0 bg-linear-to-r ${style.tint} to-transparent transition-colors duration-700`} />
      {state === "online" && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-linear-to-r from-transparent to-transparent motion-safe:animate-sweep via-green-300/30" />
      )}
      <span className={`absolute inset-y-0 left-0 w-1 ${style.dot} transition-colors duration-700`} />

      <div className="relative min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Device</p>
        <div className="flex items-center gap-3">
          <h1 className="truncate text-2xl font-semibold leading-tight tracking-tight">{deviceId}</h1>
          {!isLoading && (
            <span
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-700 ${style.chip}`}
            >
              <StatusOrb state={state} />
              {style.label}
            </span>
          )}
        </div>
      </div>

      {isLoading && <div className="relative h-8 w-40 animate-pulse rounded-full bg-slate-200" />}

      {isError && <p className="relative text-sm text-destructive">Could not load the device: {getErrorMessage(error)}</p>}

      {connectionStatus && (
        <TooltipProvider delayDuration={100}>
          <div className="relative flex shrink-0 items-center gap-2">
            <StatusIcon label="IoT-Edge Runtime" state={connectionStatus.iotEdgeRuntime} icon={Cpu} />
            <StatusIcon label="IoT-Hub" state={connectionStatus.iotHub} icon={Cloud} />
            <StatusIcon label="Smart-EMS" state={connectionStatus.sems} icon={Router} />
            {connectionStatus.vpn !== undefined && (
              <StatusIcon label="VPN" state={connectionStatus.vpn ?? undefined} icon={ShieldCheck} />
            )}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
