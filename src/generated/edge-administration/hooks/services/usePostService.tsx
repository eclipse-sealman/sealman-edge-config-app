import { edgeApi } from "@/generated/edge-administration/api";
import { components } from "@/generated/edge-administration/types";

export type ServiceCreate = components["schemas"]["ServiceCreate"];

export function usePostService() {
  const mutation = edgeApi.useMutation("post", "/services");

  const postService = async ({ endpointId, body }: { endpointId: string; body: ServiceCreate }) => {
    return mutation.mutateAsync({
      params: {
        query: { endpoint_id: endpointId },
      },
      body,
    });
  };

  return { postService, isPending: mutation.isPending };
}
