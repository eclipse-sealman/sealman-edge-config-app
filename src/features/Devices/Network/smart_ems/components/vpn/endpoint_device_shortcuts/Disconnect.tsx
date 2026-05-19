import { Button } from "@/components/ui/button";
import { Tooltip } from "@/features/Devices/Network/components/tooltip";
import { Link2, Link2Off, Loader2 } from "lucide-react";
import { useDisconnectFromVpn } from "../../../hooks";
import { useVPNConnectionLock } from "../../../stores";

interface props {
  connectionId: number
}

export function Disconnect({ connectionId }: props) {
  const isWaiting = useVPNConnectionLock(s => s.isConnectingOrDisconnecting);
  const { disconnectFromVpn } = useDisconnectFromVpn();

  return (
    <Tooltip content="Disconnect VPN">
      <Button
        size="icon"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation()
          disconnectFromVpn(connectionId)
        }}
        className="group text-green-500 hover:text-destructive"
        disabled={ isWaiting }
      >
        {
          !isWaiting && (
            <>
              <span className="block group-hover:hidden">
                <Link2 />
              </span>
              <span className="hidden group-hover:block">
                <Link2Off />
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
