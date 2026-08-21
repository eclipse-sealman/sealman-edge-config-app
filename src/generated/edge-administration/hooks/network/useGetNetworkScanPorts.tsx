import { edgeApi } from "../../api";

export default function useGetNetworkScanPorts(device: string) {
  return edgeApi.useQuery("get", "/{device}/network/scan-ports", {
    params: {
      path: {
        device
      }
    }
  })
}
