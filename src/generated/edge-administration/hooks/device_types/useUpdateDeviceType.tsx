import { edgeApi } from "@/generated/edge-administration/api";
import { components } from "@/generated/edge-administration/types";

export type DeviceTypeUpdate = components["schemas"]["DeviceTypeUpdate"];

export function useUpdateDeviceType() {
  const mutation = edgeApi.useMutation("patch", "/device-types/{type_id}");

  const updateDeviceType = async ({ typeId, body }: { typeId: string; body: DeviceTypeUpdate }) => {
    return mutation.mutateAsync({
      params: {
        path: { type_id: typeId },
      },
      body,
    });
  };

  return { updateDeviceType, isPending: mutation.isPending };
}
