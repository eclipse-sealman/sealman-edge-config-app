import { edgeApi } from "../api";
import { NETWORK_DISCOVER_MODULE_NAME } from "@/api/edgeConfig/moduleNames";

// The API no longer publishes these models in its OpenAPI document (WP-4): the net-discover
// provider schema validates the body. These mirror the shape the UI sends and the API's own
// net-discover test payloads.
export type ScanDefinition = {
  networkDefinition: string
  subnetMask: number
  ports: number[]
}

type Endpoint = {
  name: string
  description?: string | null
  serviceNames: { [key: string]: string }
}

export type NetworkDiscoverModuleConfigV1 = {
  scheduledCron: string
  scanDefinition: ScanDefinition
  endpointNames: { [key: string]: Endpoint }
}

const NETWORK_DISCOVER_TWIN_CONFIG_PATH = `/{device}/twin/config/${NETWORK_DISCOVER_MODULE_NAME}` as const;

export function usePostModuleNetDiscover() {
  const mutation = edgeApi.useMutation("post", NETWORK_DISCOVER_TWIN_CONFIG_PATH)

  const PostNetDiscoverModule = async({deviceId, body}: {deviceId: string, body: NetworkDiscoverModuleConfigV1}) => {
    await mutation.mutateAsync({
      params: {
        path: {
          device: deviceId,
        }
      },
      // TODO API SPEC: the spec types this free-form body as Record<string, never> (no provider
      // schema is active when it is generated offline). Remove the cast once the body type is published.
      body: body as unknown as Record<string, never>,
    })
  }

  return { PostNetDiscoverModule, isPending: mutation.isPending }
}
