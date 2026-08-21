import { edgeApi } from "@/generated/edge-administration/api";

export default function useGetEndpoint(endpointId: string) {
  return edgeApi.useQuery("get", "/endpoints/{endpoint_id}", {
    params: {
      path: { endpoint_id: endpointId },
    },
  });
}
