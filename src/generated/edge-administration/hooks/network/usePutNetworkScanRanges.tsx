import { edgeApi } from "../../api";
import { components } from "../../types";

export type NetworkRange = components["schemas"]["NetworkRange"]

interface props {
  deviceId: string
  body: NetworkRange[]
}

export default function usePutNetworkScanRanges() {
  const mutation = edgeApi.useMutation("put", "/{device}/network/scan-ranges")

  const mutateAsync = ({ deviceId, body }: props) => mutation.mutateAsync({
    body,
    params: {
      path: {
        device: deviceId
      }
    }
  })

  return { mutateAsync, isPending: mutation.isPending }
}
