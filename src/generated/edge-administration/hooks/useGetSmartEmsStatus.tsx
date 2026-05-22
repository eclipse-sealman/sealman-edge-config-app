import { UseQueryOptions } from "@tanstack/react-query";
import { edgeApi } from "../api";

export default function useGetSmartEmsStatus(deviceId: string, props?: Partial<UseQueryOptions>) {
  const query = edgeApi.useQuery("get", "/{device}/smartems/status", {
    params: {
      path: { device: deviceId },
    },
    ...props,
  })

  return query
}
