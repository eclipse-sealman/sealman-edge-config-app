import ButtonWithLoading from "@/features/Devices/Network/components/buttons/ButtonWithLoading";
import { Link2 } from "lucide-react";
import { useVPNConnectionLock } from "../../../stores";
import { useConnectEdgeDeviceToVpn } from "../../../hooks/useConnectEdgeDeviceToVpn";

interface Props {
  readonly deviceId: number
}

export function ConnectEdgeDevice({deviceId}: Props) {
  const isWaiting = useVPNConnectionLock(s => s.isConnectingOrDisconnecting);
  const { connectToVpn } = useConnectEdgeDeviceToVpn();

  const handleOnClick = async () => {
    connectToVpn(deviceId)
  }

  return (
    <div>
      <p>To access the edge device from your network, you must connect it to the SmartEMS VPN.</p>
      <div className="sm:text-right">
        <ButtonWithLoading handleOnClick={handleOnClick} isLoading={ isWaiting }>
          <Link2 /> Connect to Edge Device
        </ButtonWithLoading>
      </div>
    </div>
  );
}
