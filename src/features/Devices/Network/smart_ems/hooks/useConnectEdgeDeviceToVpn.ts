import { useInvalidateConnections } from "../services/smartems/hooks";
import { toast } from "react-toastify";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { openVpnConnectionByDeviceId } from "../services/smartems/api";
import { useVPNConnectionLock } from "../stores";

/**
 * Hook for connecting the edge device itself directly to the VPN.
 * This is the version of the connect hook that initiates a VPN connection for the device, not for endpoints behind it.
 */
export function useConnectEdgeDeviceToVpn() {
  const setIsConnectingOrDisconnecting = useVPNConnectionLock(s => s.setIsConnectingOrDisconnecting);
  const [isLoading, setIsLoading] = useState(false)
  const { mutateAsync } = useMutation({
    mutationFn: openVpnConnectionByDeviceId,
  });
  const { invalidate } = useInvalidateConnections();

  const connectToVpn = async (deviceId: number) => {
    setIsLoading(true)
    setIsConnectingOrDisconnecting(true);
    try {
      await mutateAsync(deviceId);
      await invalidate();
      toast.success("Device successfully connected to VPN");
    } catch (err) {
      toast.error("Error while trying to connect. Please try again. If the issue persists, please contact your division administrator.");
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsConnectingOrDisconnecting(false);
    }
  };

  return { connectToVpn, isLoading };
}
