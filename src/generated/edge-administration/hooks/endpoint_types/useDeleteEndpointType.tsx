import { edgeApi } from "@/generated/edge-administration/api";

export function useDeleteEndpointType() {
  const mutation = edgeApi.useMutation("delete", "/endpoint-types/{type_id}");

  const deleteEndpointType = async (typeId: string, cascade = false) => {
    return mutation.mutateAsync({
      params: {
        path: { type_id: typeId },
        query: { cascade },
      },
    });
  };

  return { deleteEndpointType, isPending: mutation.isPending };
}
