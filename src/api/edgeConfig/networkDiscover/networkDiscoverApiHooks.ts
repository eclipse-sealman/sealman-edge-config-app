import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DirectMethodResponse, edgeConfigApi } from "../edgeConfigApi";
import { AxiosError } from "axios";
import { NETWORK_DISCOVER_MODULE_NAME } from "../moduleNames";
import {
  DEFAULT_NETWORK_DISCOVER_TWIN_CONFIG_TEMPLATE,
  NetworkDiscoverTwinConfig,
  NetworkDiscoverTwinConfigGet,
  NetworkScanData,
  ScanDefinition,
} from "./networkDiscoverInterfaces";

const useGetNetworkDiscoverTwinConfig = (deviceId: string) =>
  useQuery<NetworkDiscoverTwinConfigGet, AxiosError>({
    queryKey: ["getTwinConfig", deviceId, NETWORK_DISCOVER_MODULE_NAME],
    queryFn: () => edgeConfigApi.getTwinConfig(deviceId, NETWORK_DISCOVER_MODULE_NAME),
  });


/**
 * Patches the network discover twin config and applies a default configuration if no configuration has been set yet
 * @param deviceId
 * @returns
 */
const usePatchNetworkDiscoverTwinConfig = (deviceId: string) => {
  const getNetworkDiscoverTwinConfig = useGetNetworkDiscoverTwinConfig(deviceId);
  const queryClient = useQueryClient();


  return useMutation({
    mutationFn: async (patch: Partial<NetworkDiscoverTwinConfig>) => {
      await getNetworkDiscoverTwinConfig.refetch();
      const updatedNetworkDiscoverTwinConfig: NetworkDiscoverTwinConfig = {
        ...getNetworkDiscoverTwinConfig.data || DEFAULT_NETWORK_DISCOVER_TWIN_CONFIG_TEMPLATE,
        ...patch
      }

      return edgeConfigApi.postTwinConfig(
        deviceId,
        NETWORK_DISCOVER_MODULE_NAME,
        updatedNetworkDiscoverTwinConfig
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["getTwinConfig", deviceId, NETWORK_DISCOVER_MODULE_NAME] })
    }
  });
};

const usePostNetworkDiscover = (deviceId: string) =>
  useMutation<
    DirectMethodResponse<NetworkScanData>,
    AxiosError,
    ScanDefinition
  >({
    mutationFn: (payload) =>
      edgeConfigApi.postDeviceNetworkDiscover(deviceId, payload),
  });

const useGetPeriodicNetworkScanResult = (deviceId: string) =>
  useQuery({
    queryKey: ["getPeriodicNetworkScanResult", deviceId],
    queryFn: () => edgeConfigApi.getPeriodicNetworkScanResult(deviceId),
  });

export const networkDiscoverHooks = {
  usePostNetworkDiscover,
  useGetPeriodicNetworkScanResult,
  useGetNetworkDiscoverTwinConfig,
  usePatchNetworkDiscoverTwinConfig,
};
