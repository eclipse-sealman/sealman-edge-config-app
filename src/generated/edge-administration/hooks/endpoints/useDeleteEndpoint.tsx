import { edgeApi } from "@/generated/edge-administration/api";

export function useDeleteEndpoint() {
  const mutation = edgeApi.useMutation("delete", "/endpoints/{endpoint_id}");

  const deleteEndpoint = async (endpointId: string) => {
    return mutation.mutateAsync({
      params: {
        path: { endpoint_id: endpointId },
      },
    });
  };

  return { deleteEndpoint, isPending: mutation.isPending };
}
