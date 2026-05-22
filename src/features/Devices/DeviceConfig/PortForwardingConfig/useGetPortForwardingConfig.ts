import { edgeApi } from "src/generated/edge-administration/api"

export const useGetPortForwardingConfig = (deviceId: string) => {
  return edgeApi.useQuery(
    "get",
    "/{device}/smartems/config/port-forwarding",
    {
      params: {
        path: { device: deviceId },
      },
    }
  );
};