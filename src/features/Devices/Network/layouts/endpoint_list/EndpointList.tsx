import { useMemo } from "react";
import { Centered, EndpointStatus } from "@/features/Devices/Network/components";
import {
  useNetworkPageStore,
  useTwinConfigStore,
  useEndpointSearchStore,
  useDisplayTopologyStore,
} from "@/features/Devices/Network/stores";
import { Loader2 } from "lucide-react";
import { useHandleSelectedEndpoint } from "@/features/Devices/Network/useHandleSelectedEndpoint";
import { useGetPeriodicScanData } from "./useGetPeriodicScanData";
import { SmartEmsVpnShortcut } from "../../smart_ems/layouts/VpnShortcut";

export default function EndpointList() {
  const deviceId = useNetworkPageStore((s) => s.deviceId);
  const search = useEndpointSearchStore((s) => s.search);
  const endpointConfigList = useTwinConfigStore((s) => s.endpointConfigList);
  const selectedEndpointIp = useNetworkPageStore((s) => s.selectedEndpointIp);
  const { scanResults, isLoading } = useGetPeriodicScanData(deviceId);
  const { handleSelectEndpoint } = useHandleSelectedEndpoint();

  const displayTopology = useDisplayTopologyStore((s) => s.displayTopology);
  const displayEdgeDevice = useNetworkPageStore((s) => s.displayEdgeDevice);

  const scannedEndpoints = scanResults ?? [];

  const getDescriptionOrNameByIp = (ip: string): string | undefined => {
    const description = endpointConfigList[ip]?.description;
    const name = endpointConfigList[ip]?.name;
    return description || name || undefined;
  };

  const filteredList = useMemo(() => {
    return scannedEndpoints.filter(
      (v) =>
        getDescriptionOrNameByIp(v.ip)?.toLowerCase().includes(search.toLowerCase()) || v.ip.includes(search),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, scannedEndpoints]);

  const isEndpointSelected = (ip: string) => {
    return selectedEndpointIp === ip;
  };

  if (isLoading) {
    return (
      <Centered>
        <p className="flex text-xs text-muted-foreground items-center gap-2">
          <Loader2 className="animate-spin" /> Loading ...
        </p>
      </Centered>
    );
  }

  if (filteredList.length == 0) {
    return (
      <Centered>
        <p className="text-xs text-muted-foreground items-center">No endpoints found using your search</p>
      </Centered>
    );
  }

  return (
    <div className="p-1">
      {filteredList.map((v) => (
        <button
          data-testid={v.ip}
          key={v.ip}
          className="flex items-center justify-between space-x-2 w-full"
          onClick={() => handleSelectEndpoint(v.ip)}
        >
          <div
            className={`flex items-center space-x-2 grow hover:cursor-pointer text-muted-foreground hover:text-vibrant-blue`}
          >
            <div className="">
              <EndpointStatus value={v.status} />
            </div>
            <p
              className={`px-2 flex min-h-[36px] rounded-md items-center ${isEndpointSelected(v.ip) && !displayTopology && !displayEdgeDevice ? "text-white bg-vibrant-blue/95" : ""}`}
            >
              {getDescriptionOrNameByIp(v.ip) ?? v.ip}
            </p>
          </div>
          <div className="min-w-[36px]">
            <SmartEmsVpnShortcut endpointPhysicalIp={v.ip} vpnContainerName={deviceId} status={v.status} />
          </div>
        </button>
      ))}
    </div>
  );
}
