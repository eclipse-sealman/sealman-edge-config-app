import { edgeApi } from "../api";
import { components } from "../types";
import { NETWORK_DISCOVER_MODULE_NAME } from "@/api/edgeConfig/moduleNames";

export type NetworkDiscoverModuleConfigV1 = components["schemas"]["NetworkDiscoverModuleConfigV1"]
export type ScanDefinition = components["schemas"]["ScanDefinition"]

const NETWORK_DISCOVER_TWIN_CONFIG_PATH = `/{device}/twin/config/${NETWORK_DISCOVER_MODULE_NAME}` as const;

export function usePostModuleNetDiscover() {
  const mutation = edgeApi.useMutation("post", NETWORK_DISCOVER_TWIN_CONFIG_PATH)

  const PostNetDiscoverModule = async({deviceId, body}: {deviceId: string, body: components["schemas"]["NetworkDiscoverModuleConfigV1"]}) => {
    await mutation.mutateAsync({
      params: {
        path: {
          device: deviceId,
        }
      },
      body,
    })
  }

  return { PostNetDiscoverModule, isPending: mutation.isPending }
}
