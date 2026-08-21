import { edgeApi } from "@/generated/edge-administration/api";

export default function useGetServices({ endpointId, typeId }: { endpointId: string; typeId?: string }) {
  return edgeApi.useQuery("get", "/services", {
    params: {
      query: { endpoint_id: endpointId, type_id: typeId },
    },
  });
}
