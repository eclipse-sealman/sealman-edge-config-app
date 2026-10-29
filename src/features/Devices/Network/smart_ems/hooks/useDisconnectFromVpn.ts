import { closeVpnConnectionById } from "../services/smartems/api";
import { useInvalidateConnections } from "../services/smartems/hooks";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useVPNConnectionLock } from "../stores";

export function useDisconnectFromVpn() {
  const setIsConnectingOrDisconnecting = useVPNConnectionLock(s => s.setIsConnectingOrDisconnecting);
  const [isLoading, setIsLoading] = useState(false)
  const { mutateAsync } = useMutation({
    mutationFn: closeVpnConnectionById,
  });
  const { invalidate } = useInvalidateConnections();

  const disconnectFromVpn = async (connectionId: number) => {
    setIsLoading(true)
    setIsConnectingOrDisconnecting(true);
    try {
      await mutateAsync(connectionId);
      await invalidate();
      toast.success("Endpoint disconnected from VPN");
    } catch (err) {
      toast.error("Could not disconnect from VPN. Please try again or contact your administrator.");
      console.error(err);
    } finally {
      setIsLoading(false)
      setIsConnectingOrDisconnecting(false);
    }
  };

  return { disconnectFromVpn, isLoading };
}
