import { edgeApi } from "../api";
import { components } from "../types";

export function usePostDeviceNatConfig() {
  const mutation = edgeApi.useMutation("post", "/{device}/smartems/config/nat")

  const postDeviceNatConfig = async({deviceId, body}: {deviceId: string, body: components["schemas"]["NatConfig"]}) => {
    await mutation.mutateAsync({
      params: {
        path: {
          device: deviceId
        }
      },
      body,
    })
  }

  return { postDeviceNatConfig, isPending: mutation.isPending }
}
