import { edgeApi } from "@/generated/edge-administration/api";

export function useDeleteServiceType() {
  const mutation = edgeApi.useMutation("delete", "/service-types/{type_id}");

  const deleteServiceType = async (typeId: string) => {
    return mutation.mutateAsync({
      params: {
        path: { type_id: typeId },
      },
    });
  };

  return { deleteServiceType, isPending: mutation.isPending };
}
