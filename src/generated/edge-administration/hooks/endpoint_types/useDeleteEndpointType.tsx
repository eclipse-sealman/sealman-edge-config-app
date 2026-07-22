import { edgeApi } from "@/generated/edge-administration/api";

export function useDeleteEndpointType() {
  const mutation = edgeApi.useMutation("delete", "/endpoint-types/{type_id}");

  const deleteEndpointType = async (typeId: string) => {
    return mutation.mutateAsync({
      params: {
        path: { type_id: typeId },
      },
    });
  };

  return { deleteEndpointType, isPending: mutation.isPending };
}
