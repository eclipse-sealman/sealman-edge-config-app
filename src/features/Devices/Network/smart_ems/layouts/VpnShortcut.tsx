import {
  useGetEndpointByIp,
  useGetVPNContainerEndpointDevices,
  useGetVpnContainerClientByName,
  useGetConnectionByEndpointDeviceId,
  isWaiting,
} from "../services/smartems/hooks";
import { Wait } from "../components/vpn/endpoint_device_shortcuts/Wait";
import { Connect } from "../components/vpn/endpoint_device_shortcuts/Connect";
import { Disconnect } from "../components/vpn/endpoint_device_shortcuts/Disconnect";
import { LoadingShortcut } from "../components/vpn/endpoint_device_shortcuts/Loading";
import { NoVpnContainerClient } from "../components/vpn/endpoint_device_shortcuts/NoContainer";
import { NotInContainer } from "../components/vpn/endpoint_device_shortcuts/Alert";

interface props {
  endpointPhysicalIp: string;
  vpnContainerName: string;
  status: string;
}

export function SmartEmsVpnShortcut({ endpointPhysicalIp, vpnContainerName, status }: props) {
  const { vpnContainerClient, isLoading, isError } = useGetVpnContainerClientByName(vpnContainerName);
  const { endpointDevices = [] } = useGetVPNContainerEndpointDevices(vpnContainerName);
  const endpointDevice = useGetEndpointByIp(endpointDevices, endpointPhysicalIp);
  const { connection } = useGetConnectionByEndpointDeviceId(endpointDevice?.id);

  if (isLoading) return <LoadingShortcut />;
  if (isError) return <></>;
  if (!vpnContainerClient) return <NoVpnContainerClient />;
  if (!endpointDevice) return <NotInContainer />;
  if (status != "online") return <></>;

  if (isWaiting(new Date(endpointDevice.createdAt), new Date(vpnContainerClient.seenAt))) {
    return <Wait />;
  }

  if (!connection) {
    return <Connect endpointDeviceId={endpointDevice.id} />;
  }

  if (connection) {
    return <Disconnect connectionId={connection?.id} />;
  }

  return <></>;
}
