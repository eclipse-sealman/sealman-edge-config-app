import { edgeApi } from "@/generated/edge-administration/api";
import { components } from "@/generated/edge-administration/types";

export type ServiceTypeUpdate = components["schemas"]["ServiceTypeUpdate"];

export function useUpdateServiceType() {
  const mutation = edgeApi.useMutation("patch", "/service-types/{type_id}");

  const updateServiceType = async ({ typeId, body }: { typeId: string; body: ServiceTypeUpdate }) => {
    return mutation.mutateAsync({
      params: {
        path: { type_id: typeId },
      },
      body,
    });
  };

  return { updateServiceType, isPending: mutation.isPending };
}
