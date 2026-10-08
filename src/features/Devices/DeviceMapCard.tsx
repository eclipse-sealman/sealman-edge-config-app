import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";
import useGetEndpoints from "@/generated/edge-administration/hooks/endpoints/useGetEndpoints";

interface ConnectionStatusData {
  iotEdgeRuntime: string;
  iotHub: string;
  sems: string;
  vpn?: string;
}

function StatusDot({ label, connected }: { label: string; connected: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={`${label}: ${connected ? "Connected" : "Disconnected"}`}
          className={cn("h-3 w-3 rounded-full", connected ? "bg-green-500" : "bg-red-500")}
        />
      </TooltipTrigger>
      <TooltipContent className="z-1000">
        {label}: {connected ? "Connected" : "Disconnected"}
      </TooltipContent>
    </Tooltip>
  );
}

function ConnectionStatusMini({ deviceId }: { deviceId: string }) {
  const { isLoading, isError, data, error } = useQuery<ConnectionStatusData, Error>({
    queryKey: ["getConnectionStatus", deviceId],
    queryFn: () => edgeConfigApi.getConnectionStatus(deviceId),
  });

  if (isLoading) return <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />;
  if (isError) return <p className="text-xs text-destructive">Error {error.message}</p>;
  if (!data) return null;

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex items-center gap-2">
        <StatusDot label="Runtime" connected={data.iotEdgeRuntime === "Connected"} />
        <StatusDot label="IoT Hub" connected={data.iotHub === "Connected"} />
        <StatusDot label="SmartEMS" connected={data.sems === "Connected"} />
        {data.vpn !== undefined && <StatusDot label="VPN" connected={data.vpn === "Connected"} />}
      </div>
    </TooltipProvider>
  );
}

function EndpointCount({ deviceId }: { deviceId: string }) {
  const { data, isLoading, isError } = useGetEndpoints({ deviceId });

  // Endpoints are only readable with the matching permission - just leave the count out otherwise.
  if (isError) return null;

  return (
    <Badge variant="secondary" className="gap-1.5">
      <Server className="h-3 w-3" />
      {isLoading ? "..." : `${data?.length ?? 0} ${data?.length === 1 ? "Endpoint" : "Endpoints"}`}
    </Badge>
  );
}

interface DeviceMapCardProps {
  deviceId: string;
  customer?: string;
}

export default function DeviceMapCard({ deviceId, customer }: DeviceMapCardProps) {
  const navigate = useNavigate();

  return (
    <div className="w-64 space-y-3">
      <div className="space-y-1">
        <div className="break-all text-base font-semibold leading-tight">{deviceId}</div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {customer && <Badge variant="outline">{customer}</Badge>}
          <EndpointCount deviceId={deviceId} />
        </div>
      </div>

      <ConnectionStatusMini deviceId={deviceId} />

      <Button size="sm" variant="outline" className="w-full" onClick={() => navigate(`/devices/${encodeURIComponent(deviceId)}`)}>
        Open device
      </Button>
    </div>
  );
}
