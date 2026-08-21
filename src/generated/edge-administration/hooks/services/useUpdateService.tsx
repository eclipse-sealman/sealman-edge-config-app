import { edgeApi } from "@/generated/edge-administration/api";
import { components } from "@/generated/edge-administration/types";

export type ServiceUpdate = components["schemas"]["ServiceUpdate"];

export function useUpdateService() {
  const mutation = edgeApi.useMutation("patch", "/services/{service_id}");

  const updateService = async ({ serviceId, body }: { serviceId: string; body: ServiceUpdate }) => {
    return mutation.mutateAsync({
      params: {
        path: { service_id: serviceId },
      },
      body,
    });
  };

  return { updateService, isPending: mutation.isPending };
}
