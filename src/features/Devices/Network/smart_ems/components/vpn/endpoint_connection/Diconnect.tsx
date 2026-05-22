import ButtonWithLoading from "@/features/Devices/Network/components/buttons/ButtonWithLoading";
import { Link2Off } from "lucide-react";
import { useDisconnectFromVpn } from "../../../hooks";
import { useVPNConnectionLock } from "../../../stores";

interface props {
  connectionId: number
}

export function Disconnect({ connectionId }: props) {
  const isWaiting = useVPNConnectionLock(s => s.isConnectingOrDisconnecting);
  const { disconnectFromVpn } = useDisconnectFromVpn();

  const handleOnClick = async () => {
    disconnectFromVpn(connectionId)
  }

  return (
    <div className="sm:text-right">
      <ButtonWithLoading handleOnClick={handleOnClick} isLoading={ isWaiting } variant="destructive">
        <Link2Off /> Disconnect from VPN
      </ButtonWithLoading>
    </div>
  );
}
