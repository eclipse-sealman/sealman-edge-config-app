import { edgeApi } from "@/generated/edge-administration/api";
import { components } from "@/generated/edge-administration/types";

export type EndpointTypeUpdate = components["schemas"]["EndpointTypeUpdate"];

export function useUpdateEndpointType() {
  const mutation = edgeApi.useMutation("patch", "/endpoint-types/{type_id}");

  const updateEndpointType = async ({ typeId, body }: { typeId: string; body: EndpointTypeUpdate }) => {
    return mutation.mutateAsync({
      params: {
        path: { type_id: typeId },
      },
      body,
    });
  };

  return { updateEndpointType, isPending: mutation.isPending };
}
