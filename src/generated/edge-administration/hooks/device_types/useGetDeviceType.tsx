import { edgeApi } from "@/generated/edge-administration/api";

export default function useGetDeviceType(typeId: string) {
  return edgeApi.useQuery("get", "/device-types/{type_id}", {
    params: {
      path: { type_id: typeId },
    },
  });
}
