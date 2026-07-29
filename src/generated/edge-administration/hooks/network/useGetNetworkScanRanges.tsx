import { edgeApi } from "../../api";

export default function useGetNetworkScanRanges(device: string) {
  return edgeApi.useQuery("get", "/{device}/network/scan-ranges", {
    params: {
      path: {
        device
      }
    }
  })
}
