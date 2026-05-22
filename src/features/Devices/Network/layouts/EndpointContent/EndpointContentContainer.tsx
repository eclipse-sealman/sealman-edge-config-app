import { GearIcon } from "@radix-ui/react-icons";
import useGetNetworkTopology from "@/generated/edge-administration/hooks/useGetNetworkTopology";
import { EndpointMetadataCard, ServicesCard } from "@/features/Devices/Network/layouts";
import { useEffect } from "react";
import {
  useNetworkPageStore,
  useSelectedEndpointStore,
  useTwinConfigStore,
} from "@/features/Devices/Network/stores";
import { Centered } from "@/features/Devices/Network/components";
import { SmartEMSVpnCard } from "../../smart_ems/layouts/SmartEmsVPNCard";
import { useHandleSelectedEndpoint } from "../../useHandleSelectedEndpoint";

export default function EndpointContentContainer() {
  // Ensure the selected endpoint IP is set from the URL search params
  useHandleSelectedEndpoint()

  const deviceId = useNetworkPageStore((s) => s.deviceId);
  const selectedEndpointIp = useNetworkPageStore((s) => s.selectedEndpointIp);
  const endpointConfigList = useTwinConfigStore((s) => s.endpointConfigList);
  const setSelectedEndpointState = useSelectedEndpointStore((s) => s.setSelectedEndpointState);
  const { data } = useGetNetworkTopology(deviceId);

  const isScanResultEmpty = data?.scanResults.length === 0;

  useEffect(() => {
    if (!selectedEndpointIp) {
      return;
    }

    setSelectedEndpointState(endpointConfigList[selectedEndpointIp] || { name: "", serviceNames: {} } , selectedEndpointIp);
  }, [endpointConfigList, selectedEndpointIp, setSelectedEndpointState]);

  // I don't think we need to move that to another component as there is no extra logic delacre in it.
  // Moving it to another component would only be to improve readability future reader feel free to move it 😇
  if (isScanResultEmpty) {
    return (
      <Centered>
        <div className="grid gap-4 max-w-2xl text-muted-foreground">
          <p>The latest scan result didn't find any endpoints.</p>
          <p>
            Possible reasons:
            <ul className="ml-8 list-disc">
              <li>Welotec LAN3 is not connected to the local network.</li>
              <li>Incorrect network prefix in your configuration.</li>
            </ul>
          </p>
          <p>
            <span className="sm:flex sm:items-center sm:gap-1">
              You can check your network prefix in the configuration.
              <GearIcon className="hidden sm:block text-foreground" />
            </span>
            <br className="sm:hidden" />
            You can perform a manual scan to see if there are any endpoints reachable on the network.
          </p>
        </div>
      </Centered>
    );
  }

  if (!selectedEndpointIp) {
    return (
      <Centered>
        <p className="text-muted-foreground">Select an option from the list</p>
      </Centered>
    );
  }

  const endpoint = data?.scanResults.find((e) => e.ip === selectedEndpointIp);

  if (!endpoint) {
    return (
      <Centered>
        <p className="text-muted-foreground">
          There was issue retrieving the endpoint please refresh the page
        </p>
      </Centered>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2 relative">
          <EndpointMetadataCard />
        </div>
        <div className="w-full sm:w-1/2">
          <SmartEMSVpnCard endpoint={endpoint} edgeGatewayId={deviceId} />
        </div>
      </div>
      <div className="w-full">
        <ServicesCard />
      </div>
    </div>
  );
}
