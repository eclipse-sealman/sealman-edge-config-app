import { Button } from "@/components/ui/button";
import { Tooltip } from "@/features/Devices/Network/components/tooltip";
import { Link2, Link2Off, Loader2 } from "lucide-react";
import { useConnectToVpn } from "../../../hooks";
import { useVPNConnectionLock } from "../../../stores";

interface props {
  endpointDeviceId: number
}

export function Connect({endpointDeviceId}: props) {
  const isWaiting = useVPNConnectionLock(s => s.isConnectingOrDisconnecting);
  const { connectToVpn } = useConnectToVpn();

  return (
    <Tooltip content="Connect to VPN">
      <Button
        size="icon"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          connectToVpn(endpointDeviceId)
        }}
        className="group"
        disabled={ isWaiting }
      >
        {
          !isWaiting && (
            <>
              <span className="block group-hover:hidden">
                <Link2Off className="text-destructive"/>
              </span>
              <span className="hidden group-hover:block">
                <Link2 />
              </span>
            </>
          )
        }
        {
          isWaiting && (
            <>
              <Loader2 className="animate-spin" />
            </>
          )
        }
      </Button>
    </Tooltip>
  );
}
