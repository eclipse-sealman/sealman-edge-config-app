import { edgeApi } from "@/generated/edge-administration/api";

export function useDeleteService() {
  const mutation = edgeApi.useMutation("delete", "/services/{service_id}");

  const deleteService = async (serviceId: string) => {
    return mutation.mutateAsync({
      params: {
        path: { service_id: serviceId },
      },
    });
  };

  return { deleteService, isPending: mutation.isPending };
}
