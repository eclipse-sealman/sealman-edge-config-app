import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Server, ShieldCheck } from "lucide-react";
import { WaterLoader } from "@/components/ui/water-loader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Centered } from "@/features/Devices/Network/components";
import { client } from "@/generated/edge-administration/api";
import useGetEndpointTypes from "@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes";
import type { MappedEndpoint } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import { endpointTitle, roleFieldKey } from "@/features/Devices/Network/layouts/overview/endpointDisplay";
import { endpointListKey } from "@/features/Devices/Network/layouts/overview/overviewMerge";
import { Authorization } from "@/features/Devices/Network/smart_ems/layouts/Authorization";
import { EdgeDeviceVPNCard } from "@/features/Devices/Network/smart_ems/layouts/EdgeDeviceVPNCard";

type VpnState = "connecting" | "connected";

const MOCK_CONNECT_DURATION_MS = 1500;

export default function VpnPage({ deviceId }: { deviceId: string }) {
  const { data: endpointTypes } = useGetEndpointTypes();
  const [vpnStates, setVpnStates] = useState<Record<string, VpnState>>({});
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((id) => window.clearTimeout(id));
  }, []);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["vpn-endpoints", deviceId],
    queryFn: async () => {
      const { data } = await client.GET("/{device}/network/last-known", { params: { path: { device: deviceId } } });
      return data?.endpoints ?? [];
    },
    enabled: Boolean(deviceId),
  });

  // Only endpoints that actually carry an IP address can be reached through a VPN.
  const endpoints = (data ?? []).filter((endpoint: MappedEndpoint) => Boolean(endpoint.ip));

  // The connection is mocked: it just shows a short loading state before reporting "connected".
  const connect = (key: string) => {
    setVpnStates((prev) => ({ ...prev, [key]: "connecting" }));
    const id = window.setTimeout(() => {
      setVpnStates((prev) => ({ ...prev, [key]: "connected" }));
    }, MOCK_CONNECT_DURATION_MS);
    timers.current.push(id);
  };

  const disconnect = (key: string) => {
    setVpnStates((prev) => {
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  };

  if (isLoading) {
    return (
      <Centered>
        <p className="flex items-center gap-2 text-muted-foreground">
          <WaterLoader /> Loading endpoints...
        </p>
      </Centered>
    );
  }

  if (isError) {
    return (
      <Centered>
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-destructive">Failed to load endpoints.</p>
          <Button variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Centered>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Authorization />
        <EdgeDeviceVPNCard edgeGatewayId={deviceId} />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold leading-none tracking-tight">VPN</h2>
        <p className="text-sm text-muted-foreground">
          Endpoints with an IP address. Connect to open a VPN connection to the endpoint.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-background">
        {endpoints.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">No endpoints with an IP address available.</p>
        ) : (
          <ul className="divide-y">
            {endpoints.map((endpoint: MappedEndpoint) => {
              const key = endpointListKey(endpoint);
              const state = vpnStates[key];
              const mapping = endpointTypes?.find((t) => t.type_id === endpoint.type_id)?.mapping;
              const nameKey = roleFieldKey(mapping, "name");
              const nameValue = nameKey ? endpoint.endpoint_data?.[nameKey]?.value : undefined;
              const title = endpointTitle({ typeLabel: endpoint.type_label, name: nameValue, ip: endpoint.ip });

              return (
                <li key={key} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Server className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{title}</p>
                      <p className="text-xs text-muted-foreground">{endpoint.ip}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {state === "connected" && (
                      <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
                        Connected
                      </Badge>
                    )}
                    {state === "connected" ? (
                      <Button variant="outline" size="sm" onClick={() => disconnect(key)}>
                        Disconnect
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" disabled={state === "connecting"} onClick={() => connect(key)}>
                        {state === "connecting" ? <WaterLoader /> : <ShieldCheck />}
                        {state === "connecting" ? "Connecting..." : "Connect"}
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
