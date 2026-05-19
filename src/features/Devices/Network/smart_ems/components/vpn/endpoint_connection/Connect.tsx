import ButtonWithLoading from "@/features/Devices/Network/components/buttons/ButtonWithLoading";
import { Link2 } from "lucide-react";
import { useConnectToVpn } from "../../../hooks";
import { useVPNConnectionLock } from "../../../stores";

interface props {
  endpointDeviceId: number
}

export function Connect({endpointDeviceId}: props) {
  const isWaiting = useVPNConnectionLock(s => s.isConnectingOrDisconnecting);
  const { connectToVpn } = useConnectToVpn();

  const handleOnClick = async () => {
    connectToVpn(endpointDeviceId)
  }

  return (
    <div>
      <p>To access your endpoint from your network, you must connect it to the SmartEMS VPN.</p>
      <div className="sm:text-right">
        <ButtonWithLoading handleOnClick={handleOnClick} isLoading={ isWaiting }>
          <Link2 /> Connect to VPN
        </ButtonWithLoading>
      </div>
    </div>
  );
}
