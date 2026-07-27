import { edgeApi } from "../../api";
import { components } from "../../types";

export type NetworkScan = components["schemas"]["NetworkScan-Input"]
export type NetworkOverview = components["schemas"]["NetworkOverview"]
export type MappedEndpoint = components["schemas"]["MappedEndpoint"]
export type MappedPort = components["schemas"]["MappedPort"]

interface props {
  deviceId: string
  body: NetworkScan
}

export default function usePostNetworkOverview() {
  const mutation = edgeApi.useMutation("post", "/{device}/network/overview")

  const mutateAsync = ({ deviceId, body }: props) => mutation.mutateAsync({
    body,
    params: {
      path: {
        device: deviceId
      }
    }
  })

  return { mutateAsync, isPending: mutation.isPending, data: mutation.data }
}
