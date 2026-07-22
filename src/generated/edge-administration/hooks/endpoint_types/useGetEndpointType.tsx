import { edgeApi } from "@/generated/edge-administration/api";

export default function useGetEndpointType(typeId: string) {
  return edgeApi.useQuery("get", "/endpoint-types/{type_id}", {
    params: {
      path: { type_id: typeId },
    },
  });
}
