import { edgeApi } from "@/generated/edge-administration/api";
import { components } from "@/generated/edge-administration/types";

export type EndpointUpdate = components["schemas"]["EndpointUpdate"];

export function useUpdateEndpoint() {
  const mutation = edgeApi.useMutation("patch", "/endpoints/{endpoint_id}");

  const updateEndpoint = async ({ endpointId, body }: { endpointId: string; body: EndpointUpdate }) => {
    return mutation.mutateAsync({
      params: {
        path: { endpoint_id: endpointId },
      },
      body,
    });
  };

  return { updateEndpoint, isPending: mutation.isPending };
}
