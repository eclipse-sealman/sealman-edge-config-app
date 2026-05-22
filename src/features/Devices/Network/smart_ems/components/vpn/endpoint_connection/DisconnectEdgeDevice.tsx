import ButtonWithLoading from "@/features/Devices/Network/components/buttons/ButtonWithLoading";
import { Link2Off } from "lucide-react";
import { useDisconnectFromVpn } from "../../../hooks";
import { useVPNConnectionLock } from "../../../stores";

interface Props {
  readonly connectionId: number
}

export function DisconnectEdgeDevice({ connectionId }: Props) {
  const isWaiting = useVPNConnectionLock(s => s.isConnectingOrDisconnecting);
  const { disconnectFromVpn } = useDisconnectFromVpn();

  const handleOnClick = async () => {
    disconnectFromVpn(connectionId)
  }

  return (
    <div className="sm:text-right">
      <ButtonWithLoading handleOnClick={handleOnClick} isLoading={ isWaiting } variant="destructive">
        <Link2Off /> Disconnect from Edge Device
      </ButtonWithLoading>
    </div>
  );
}
