import { edgeApi } from "../../api";

export default function useGetNetworkScanRange(device: string) {
  return edgeApi.useQuery("get", "/{device}/network/scan-range", {
    params: {
      path: {
        device
      }
    }
  })
}
