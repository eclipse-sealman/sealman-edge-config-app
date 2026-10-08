import { useState } from "react";
import { Loader2, PlugZap, ShieldCheck, Unplug } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/Typography/Heading";
import useGetEndpoints from "@/generated/edge-administration/hooks/endpoints/useGetEndpoints";

type VpnState = "disconnected" | "connecting" | "connected";

const SIMULATED_CONNECT_MS = 1200;

export default function VpnConnectionsTab({ deviceId }: { deviceId: string }) {
  const { data: endpoints, isLoading, isError, isFetching } = useGetEndpoints({ deviceId });
  const [states, setStates] = useState<Record<string, VpnState>>({});

  const setState = (endpointId: string, state: VpnState) =>
    setStates((current) => ({ ...current, [endpointId]: state }));

  const toggle = (endpointId: string) => {
    if (states[endpointId] === "connected") {
      setState(endpointId, "disconnected");
      return;
    }
    setState(endpointId, "connecting");
    setTimeout(() => setState(endpointId, "connected"), SIMULATED_CONNECT_MS);
  };

  const vpnEndpoints = (endpoints ?? []).filter((endpoint) => {
    const ip = endpoint.endpoint_data.ip?.value;
    return typeof ip === "string" && ip !== "";
  });

  return (
    <div className="space-y-4">
      <Heading
        processing={isFetching}
        description="Endpoints of this device that have an IP address. Connect to reach them through the VPN."
      >
        <ShieldCheck className="w-5 h-5" />
        VPN Connections
      </Heading>

      <Alert>
        <AlertDescription>Connections are simulated for now. No real VPN connection is established.</AlertDescription>
      </Alert>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading endpoints...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load endpoints.</p>
      ) : vpnEndpoints.length === 0 ? (
        <p className="text-sm text-muted-foreground">No endpoints with an IP address are defined for this device.</p>
      ) : (
        <ul className="divide-y rounded-lg border bg-background">
          {vpnEndpoints.map((endpoint) => {
            const name = endpoint.endpoint_data.name?.value as string | undefined;
            const ip = endpoint.endpoint_data.ip?.value as string;
            const state = states[endpoint.endpoint_id] ?? "disconnected";
            return (
              <li key={endpoint.endpoint_id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="truncate text-sm font-medium">{name ?? endpoint.type_label}</span>
                    <Badge variant="secondary">{endpoint.type_label}</Badge>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">{ip}</span>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {state === "connected" ? "Connected" : state === "connecting" ? "Connecting..." : "Not connected"}
                  </span>
                  <Button
                    size="icon"
                    variant={state === "connected" ? "secondary" : "outline"}
                    disabled={state === "connecting"}
                    onClick={() => toggle(endpoint.endpoint_id)}
                    aria-label={state === "connected" ? `Disconnect VPN for ${ip}` : `Connect VPN for ${ip}`}
                    title={state === "connected" ? "Disconnect VPN" : "Connect VPN"}
                  >
                    {state === "connecting" ? (
                      <Loader2 className="animate-spin" />
                    ) : state === "connected" ? (
                      <Unplug className="text-green-600" />
                    ) : (
                      <PlugZap />
                    )}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
