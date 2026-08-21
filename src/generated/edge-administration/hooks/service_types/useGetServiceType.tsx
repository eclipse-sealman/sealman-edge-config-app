import { edgeApi } from "@/generated/edge-administration/api";

export default function useGetServiceType(typeId: string) {
  return edgeApi.useQuery("get", "/service-types/{type_id}", {
    params: {
      path: { type_id: typeId },
    },
  });
}
