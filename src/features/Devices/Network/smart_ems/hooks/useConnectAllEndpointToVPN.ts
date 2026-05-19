import {
  isWaiting,
  useGetUserEndpointDeviceConnectionsQuery,
  useGetVpnContainerClientByName,
  useGetVPNContainerEndpointDevices,
  useInvalidateConnections,
} from "../services/smartems/hooks";
import { useMutation } from "@tanstack/react-query";
import { openVpnConnectionByEndpointId } from "../services/smartems/api";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { useGetPeriodicScanData } from "@/features/Devices/Network/layouts/endpoint_list/useGetPeriodicScanData";
import { useVPNConnectionLock } from "../stores";

export function useConnectAllEndpointToVPN(deviceId: string) {
  const setIsConnectingOrDisconnecting = useVPNConnectionLock(s => s.setIsConnectingOrDisconnecting);
  const [isPending, setIsPending] = useState(false);
  const { vpnContainerClient } = useGetVpnContainerClientByName(deviceId);
  const { endpointDevices = [] } = useGetVPNContainerEndpointDevices(deviceId);
  const { scanResults, isLoading } = useGetPeriodicScanData(deviceId);
  const { connections } = useGetUserEndpointDeviceConnectionsQuery();
  const { invalidate } = useInvalidateConnections();
  const { mutateAsync } = useMutation({
    mutationFn: openVpnConnectionByEndpointId,
  });

  useEffect(() => {
    setIsPending(isLoading);
  }, [isLoading]);

  const connectAll = async () => {
    if (!connections) {
      return;
    }

    if (endpointDevices.length == 0) {
      return;
    }

    if (!vpnContainerClient) {
      return;
    }

    setIsPending(true);
    setIsConnectingOrDisconnecting(true);

    const disconnectedIds = endpointDevices
      .filter((device) => scanResults?.find((s) => s.ip === device.physicalIp && s.status === "online"))
      .filter((device) => !connections?.find((c) => c.endpointDevice.id === device.id))
      .filter((device) => !isWaiting(new Date(device.createdAt), new Date(vpnContainerClient.seenAt)))
      .map((device) => device.id);

    if (!disconnectedIds.length) {
      setIsConnectingOrDisconnecting(false);
      toast.warn("No valid endpoint to connect.")
      return
    }

    try {
      // Have to connect one by one as the requests can fail if done in parallel
      // await Promise.allSettled(disconnectedIds.map((id) => mutateAsync(id)));
      for (const id of disconnectedIds) {
        try {
          await mutateAsync(id);
          toast.success(`Connected to endpoint ${id}`);
        } catch (err) {
          // Optionally handle individual errors here
          toast.error(`Error connecting to endpoint ${id}`);
          console.error(`Error connecting to endpoint ${id}:`, err);
        }
      }
      await invalidate();
      //toast.success(`Connected to ${disconnectedIds.length} endpoints`);
    } catch (err) {
      toast.error("Error while trying to connect all endpoints");
      console.error(err);
    } finally {
      setIsPending(false);
      setIsConnectingOrDisconnecting(false);
    }
  };

  return { connectAll, isPending };
}
