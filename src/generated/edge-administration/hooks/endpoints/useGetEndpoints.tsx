import { edgeApi } from "@/generated/edge-administration/api";

export default function useGetEndpoints({ deviceId, typeId }: { deviceId: string; typeId?: string }) {
  return edgeApi.useQuery("get", "/endpoints", {
    params: {
      query: { device_id: deviceId, type_id: typeId },
    },
  });
}
