import { edgeApi } from "@/generated/edge-administration/api";

export default function useGetDevice(deviceId: string) {
  const query = edgeApi.useQuery("get", "/devices/{device_id}", {
    params: {
      path: {
        device_id: deviceId,
      },
    },
  });

  return query;
}