import { Button } from "@/components/ui/button";
import { Link2, Loader2 } from "lucide-react";
import { useGetVpnContainerClientByName } from "../../../services/smartems/hooks";
import { NoVpnContainerClient } from "./NoContainer";
import { LoadingShortcut } from "./Loading";
import { useNetworkPageStore } from "@/features/Devices/Network/stores";
import { Tooltip } from "@/features/Devices/Network/components/tooltip";
import { useConnectAllEndpointToVPN } from "../../../hooks/useConnectAllEndpointToVPN";
import { useVPNConnectionLock } from "../../../stores";



export function ConnectAll({ deviceId }: {deviceId: string}) {
  const isWaiting = useVPNConnectionLock(s => s.isConnectingOrDisconnecting);
  const { connectAll } = useConnectAllEndpointToVPN(deviceId)

  return (
    <>
      <Tooltip content="Connect all disconnected endpoints to VPN">
        <Button size="icon" variant="outline" onClick={connectAll} disabled={ isWaiting }>
          {
            !isWaiting && (
               <Link2 />
            )
          }
          {
            isWaiting && (
              <Loader2 className="animate-spin" />
            )
          }
        </Button>
      </Tooltip>
    </>
  );
}

export function ConnectAllProvided() {
  const deviceId = useNetworkPageStore((s) => s.deviceId);
  const { vpnContainerClient, isLoading, isError } = useGetVpnContainerClientByName(deviceId);

  if (isLoading) return <LoadingShortcut />;
  if (isError) return <></>
  if (!vpnContainerClient) return <NoVpnContainerClient />;

  return <ConnectAll deviceId={deviceId} />
}
