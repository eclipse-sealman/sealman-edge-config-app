import { edgeApi } from "../api";

export default function usePostDeviceRequestPassword(device: string) {
  const devicesQuery = edgeApi.useQuery("post", "/{device}/smartems/secret/request", {
    params: {
      path: { device },
    },
  })

  return devicesQuery
}
