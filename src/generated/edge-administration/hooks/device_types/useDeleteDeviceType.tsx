import { edgeApi } from "@/generated/edge-administration/api";

export function useDeleteDeviceType() {
  const mutation = edgeApi.useMutation("delete", "/device-types/{type_id}");

  const deleteDeviceType = async (typeId: string) => {
    return mutation.mutateAsync({
      params: {
        path: { type_id: typeId },
      },
    });
  };

  return { deleteDeviceType, isPending: mutation.isPending };
}
