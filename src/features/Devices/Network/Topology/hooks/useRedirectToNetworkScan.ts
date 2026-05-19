import { useHandleSelectedEndpoint } from "@/features/Devices/Network/useHandleSelectedEndpoint";
import { useDisplayTopologyStore } from "../../stores";

export function useRedirectToNetworkScan() {
  const { handleSelectEndpoint } = useHandleSelectedEndpoint();
  const setDisplayTopology = useDisplayTopologyStore(s => s.setDisplayTopology);

  const redirectToNetworkScan = (ip: string) => {
    handleSelectEndpoint(ip);
    setDisplayTopology(false);
  };

  return redirectToNetworkScan;
}