import { edgeApi } from "../api"

export default function useGetModuleTwinConfig(device: string, module: string) {
  const devicesQuery = edgeApi.useQuery("get", "/{device}/twin/config/{module}", {
    params: {
      path: { 
        device, 
        module
      },
    },
  })

  return devicesQuery
}
