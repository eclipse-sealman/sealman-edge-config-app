import { edgeApi } from "../api"

export default function useGetDeviceNatConfig(device: string) {
  const devicesQuery = edgeApi.useQuery("get", "/{device}/smartems/config/nat", {
    params: {
      path: { device },
    },
  })

  return devicesQuery
}
