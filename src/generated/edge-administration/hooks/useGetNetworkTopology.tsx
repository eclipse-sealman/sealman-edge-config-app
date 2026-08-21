import { edgeApi } from "../api"
import { components } from "../types";

export type NetworkScan = components["schemas"]["NetworkScan-Output"];
export type NetworkDiscover = components["schemas"]["NetworkDiscover"]

// Keep polling for as long as this hook is mounted, rather than only refetching until the first
// result ever arrives (see useGetPeriodicScanData) - otherwise, once any scan result has been
// loaded, nothing ever refreshes it again on its own. That left changes to the scan config (e.g.
// updated ports) invisible until the whole page was reloaded: the device applies and reports a
// new scan result within seconds of a config save, but without ongoing polling the UI just kept
// showing the response from before the save indefinitely.
const NETWORK_TOPOLOGY_REFRESH_INTERVAL_MS = 3000;

//TODO: Add a barrel file for the custom hooks
export default function useGetNetworkTopology(device: string) {
  const devicesQuery = edgeApi.useQuery("get", "/{device}/network/topology", {
    params: {
      path: {
        device
      },
    },
  }, {
    refetchInterval: NETWORK_TOPOLOGY_REFRESH_INTERVAL_MS,
  })

  return devicesQuery
}
