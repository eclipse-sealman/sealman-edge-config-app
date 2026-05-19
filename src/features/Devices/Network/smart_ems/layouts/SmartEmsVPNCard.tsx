import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topology } from "../components/vpn/topology/Topology";
import { Hint } from "../components/vpn/topology/Hint";
import { NoContainer } from "../components/vpn/endpoint_connection/NoContainer";
import {
  isWaiting,
  useGetConnectionByEndpointDeviceId,
  useGetUserVpnConnectionStatus,
  useGetVpnContainerClientByName,
  useGetVpnContainerClientBySerialNumber,
  useGetVPNContainerEndpointDevicesQuery,
  useIsUserAuthenticated,
} from "../services/smartems/hooks";
import { NotInContainer } from "../components/vpn/endpoint_connection/NotInContainer";
import { Disconnect } from "../components/vpn/endpoint_connection/Diconnect";
import { CopyVirtualIp } from "../components/vpn/endpoint_connection/CopyVirtualIp";
import { Connect } from "../components/vpn/endpoint_connection/Connect";
import WaitForConnection from "../components/vpn/endpoint_connection/WaitForConnection";
import { Skeleton } from "../components/vpn/endpoint_connection/Skeleton";
import { NotOnNetwork } from "../components/vpn/endpoint_connection/NotOnNetwork";
import { ReactNode, useState } from "react";
import { NotConnected } from "../components/config/NotConnected";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SmartEmsSettingsButton,
  SmartEmsSettingsButtonIcon,
} from "../components/config/SmartEmsSettingsButton";
import { SessionTimer } from "../components/session/SessionTimer";
import { OpenVPNNotConnected } from "../components/vpn/endpoint_connection/OpenVPNNotConnected";

interface props {
  edgeGatewayId: string;
  endpoint: {
    ip: string;
    status: "online" | "offline" | "unknown";
  };
}

export function SmartEMSVpnCard({ edgeGatewayId, endpoint }: props) {
  const { isAuthenticated, isLoading } = useIsUserAuthenticated();

  //Try to fetch Edge gateway with VPN Container Client (type id 10) by serial number. If not found, fetch by name.
  const vpnContainerClientBySerial = useGetVpnContainerClientBySerialNumber(edgeGatewayId).vpnContainerClient;
  const vpnContainerClientByName = useGetVpnContainerClientByName(edgeGatewayId).vpnContainerClient;
  const vpnContainerClient = vpnContainerClientBySerial ?? vpnContainerClientByName;

  const { getEndpointByIp } = useGetVPNContainerEndpointDevicesQuery(edgeGatewayId);
  const endpointDevice = getEndpointByIp(endpoint.ip);
  const { user } = useGetUserVpnConnectionStatus()
  const { connection } = useGetConnectionByEndpointDeviceId(endpointDevice?.id);
  const [showHint, setShowHint] = useState(false);

  if (isLoading) {
    return (
      <SmartEmsVpnCardWrapper>
        <Skeleton />
      </SmartEmsVpnCardWrapper>
    );
  }

  if (!isAuthenticated) {
    return (
      <SmartEmsVpnCardWrapper>
        <NotConnected />
        <div className="sm:text-right">
          <SmartEmsSettingsButton />
        </div>
      </SmartEmsVpnCardWrapper>
    );
  }

  if (!vpnContainerClient) {
    return (
      <SmartEmsVpnCardWrapper>
        <NoContainer deviceId={edgeGatewayId} />
      </SmartEmsVpnCardWrapper>
    );
  }

  const isOnline = endpoint.status === "online";
  const isInContainer = !!endpointDevice;
  const isDeviceWaiting = isInContainer && isWaiting(new Date(endpointDevice.createdAt),  new Date(vpnContainerClient.seenAt));
  const isComputerConnected = user?.vpnConnected ?? false;
  const isReady = isOnline && isInContainer && !isDeviceWaiting;
  const isEndpointDeviceNewlyCreated = isOnline && isInContainer && isDeviceWaiting;
  const isEndpointConnected = connection?.id != undefined;
  const isEndpointDisconnected = !isEndpointConnected;

  return (
    <SmartEmsVpnCardWrapper>
      <>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Topology isComputerConnected={isComputerConnected} isDeviceConnected={isEndpointConnected} />
            <Button size="icon" onClick={() => setShowHint(!showHint)} variant="ghost">
              <Info className="text-blue-500" />
            </Button>
          </div>
          {showHint && <Hint />}
        </div>

        {!isOnline && <NotOnNetwork />}

        {!isInContainer && <NotInContainer />}

        {isEndpointDeviceNewlyCreated && <WaitForConnection lastSeen={new Date(vpnContainerClient.seenAt)} />}

        {isReady && (
          <>
            {!isComputerConnected && <OpenVPNNotConnected />}

            {isComputerConnected && isEndpointDisconnected && <Connect endpointDeviceId={endpointDevice.id} />}

            {isComputerConnected && isEndpointConnected && (
              <>
                <CopyVirtualIp virtualIp={endpointDevice?.virtualIp} />
                <Disconnect connectionId={connection.id} />
              </>
            )}
          </>
        )}
      </>
    </SmartEmsVpnCardWrapper>
  );
}

function SmartEmsVpnCardWrapper({ children }: { children: ReactNode }) {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <CardTitle>
          <div className="flex items-center justify-between">
            <p>Smart EMS VPN (feature in beta)</p>
            <div className="flex justify-end space-x-2 items-center">
              <div className="w-16">
                <SessionTimer />
              </div>
              <SmartEmsSettingsButtonIcon />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="grow space-y-4">{children}</CardContent>
    </Card>
  );
}
