import { edgeApi } from "../../api"
import { components } from "../../types";

export type LineData = components["schemas"]["Line-Output"];

export default function useGetLineByDeviceId(device: string) {
  const query = edgeApi.useQuery("get", "/{device}/line/", {
    params: {
      path: {
        device: device
      },
    },
  })

  return query
}