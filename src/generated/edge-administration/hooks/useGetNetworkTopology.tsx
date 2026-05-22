import { edgeApi } from "../api"
import { components } from "../types";

export type NetworkScan = components["schemas"]["NetworkScan"];
export type NetworkDiscover = components["schemas"]["NetworkDiscover"]

//TODO: Add a barrel file for the custom hooks
export default function useGetNetworkTopology(device: string) {
  const devicesQuery = edgeApi.useQuery("get", "/{device}/network/topology", {
    params: {
      path: {
        device
      },
    },
  })

  return devicesQuery
}
