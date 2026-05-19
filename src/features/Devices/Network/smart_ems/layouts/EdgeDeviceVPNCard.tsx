import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Topology } from "../components/vpn/topology/Topology";
import { Hint } from "../components/vpn/topology/Hint";
import { NoContainer } from "../components/vpn/endpoint_connection/NoContainer";
import {
  useGetConnectionByDeviceId,
  useGetUserVpnConnectionStatus,
  useGetVpnContainerClientByName,
  useGetVpnContainerClientBySerialNumber,
  useIsUserAuthenticated,
} from "../services/smartems/hooks";
import { CopyVirtualIp } from "../components/vpn/endpoint_connection/CopyVirtualIp";
import { Skeleton } from "../components/vpn/endpoint_connection/Skeleton";
import { ReactNode, useEffect, useState } from "react";
import { NotConnected } from "../components/config/NotConnected";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SmartEmsSettingsButton,
  SmartEmsSettingsButtonIcon,
} from "../components/config/SmartEmsSettingsButton";
import { SessionTimer } from "../components/session/SessionTimer";
import { OpenVPNNotConnected } from "../components/vpn/endpoint_connection/OpenVPNNotConnected";
import { ConnectEdgeDevice } from "../components/vpn/endpoint_connection/ConnectEdgeDevice";
import { useEdgeDeviceServicesStore } from "../../stores";
import { DisconnectEdgeDevice } from "../components/vpn/endpoint_connection/DisconnectEdgeDevice";

interface Props {
  readonly edgeGatewayId: string
}

export function EdgeDeviceVPNCard({ edgeGatewayId }: Props) {
  const { isAuthenticated, isLoading } = useIsUserAuthenticated();

  //Try to fetch Edge gateway with VPN Container Client (type id 10) by serial number. If not found, fetch by name.
  const vpnContainerClientBySerial = useGetVpnContainerClientBySerialNumber(edgeGatewayId).vpnContainerClient;
  const vpnContainerClientByName = useGetVpnContainerClientByName(edgeGatewayId).vpnContainerClient;
  const vpnContainerClient = vpnContainerClientBySerial ?? vpnContainerClientByName;
  
  const deviceId = vpnContainerClient?.id
  const { user } = useGetUserVpnConnectionStatus()
  const { connection } = useGetConnectionByDeviceId(deviceId);
  const [showHint, setShowHint] = useState(false);

  // Setting this state enables or disables the browse buttons in the services table
  const setIsConnected = useEdgeDeviceServicesStore((state) => state.setIsConnected);
  const setIpAddress = useEdgeDeviceServicesStore((state) => state.setIpAddress);

  useEffect(() => {
    if (connection?.id) {
      setIsConnected(true);
      setIpAddress(connection.device?.virtualIp ?? "");
    } else {
      setIsConnected(false);
      setIpAddress(undefined);
    }
  }, [connection, setIsConnected, setIpAddress]);

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

  if (!vpnContainerClient || !deviceId) {
    return (
      <SmartEmsVpnCardWrapper>
        <NoContainer deviceId={edgeGatewayId} />
      </SmartEmsVpnCardWrapper>
    );
  }

  const isComputerConnected = user?.vpnConnected ?? false;
  const isDeviceConnected = connection?.id != undefined;
  const isDeviceDisconnected = !isDeviceConnected;

  return (
    <SmartEmsVpnCardWrapper>
      <>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Topology isComputerConnected={isComputerConnected} isDeviceConnected={isDeviceConnected} />
            <Button size="icon" onClick={() => setShowHint(!showHint)} variant="ghost">
              <Info className="text-blue-500" />
            </Button>
          </div>
          {showHint && <Hint />}
        </div>

        <>
          {!isComputerConnected && <OpenVPNNotConnected />}

          {isComputerConnected && isDeviceDisconnected && <ConnectEdgeDevice deviceId={deviceId} />}

          {isComputerConnected && isDeviceConnected && (
            <>
              <CopyVirtualIp virtualIp={connection.device?.virtualIp} />
              <DisconnectEdgeDevice connectionId={connection.id} />
            </>
          )}
        </>
      </>
    </SmartEmsVpnCardWrapper>
  );
}

function SmartEmsVpnCardWrapper({ children }: { readonly children: ReactNode }) {
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
