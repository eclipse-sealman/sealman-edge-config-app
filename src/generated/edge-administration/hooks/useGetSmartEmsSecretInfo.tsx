import { UseQueryOptions } from "@tanstack/react-query";
import { edgeApi } from "../api";

export default function useGetSmartEmsSecretInfo(deviceId: string, props?: Partial<UseQueryOptions>) {
  return edgeApi.useQuery("get", "/{device}/smartems/secret/info", {
    params: {
      path: { device: deviceId },
    },
    ...props,
  });
}
