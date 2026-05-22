import { edgeApi } from "../../api";
import { components } from "../../types";

export type NetworkDiscover = components["schemas"]["NetworkDiscover"]
export type ScanResult = components["schemas"]["EndpointStatus"]

interface props {
  deviceId: string
  body: NetworkDiscover
}

export default function usePostDeviceNetworkDiscover() {
  const mutation = edgeApi.useMutation("post", "/{device}/network/discover")

  const mutateAsync = ({deviceId, body}: props ) => mutation.mutateAsync({
    body,
    params: {
      path: {
        device: deviceId
      }
    }
  })

  return {mutateAsync, isPending: mutation.isPending, data: mutation.data}
}
