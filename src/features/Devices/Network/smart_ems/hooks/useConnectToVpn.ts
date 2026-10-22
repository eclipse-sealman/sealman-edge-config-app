import { useInvalidateConnections } from "../services/smartems/hooks";
import { toast } from "react-toastify";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { openVpnConnectionByEndpointId } from "../services/smartems/api";
import { useVPNConnectionLock } from "../stores";

export function useConnectToVpn() {
  const setIsConnectingOrDisconnecting = useVPNConnectionLock(s => s.setIsConnectingOrDisconnecting);
  const [isLoading, setIsLoading] = useState(false)
  const { mutateAsync } = useMutation({
    mutationFn: openVpnConnectionByEndpointId,
  });
  const { invalidate } = useInvalidateConnections();

  const connectToVpn = async (endpointDeviceId: number) => {
    setIsLoading(true)
    setIsConnectingOrDisconnecting(true);
    try {
      await mutateAsync(endpointDeviceId);
      await invalidate();
      toast.success("Endpoint connected to VPN");
    } catch (err) {
      toast.error("Could not connect to VPN. Please try again or contact your administrator.");
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsConnectingOrDisconnecting(false);
    }
  };

  return { connectToVpn, isLoading };
}
