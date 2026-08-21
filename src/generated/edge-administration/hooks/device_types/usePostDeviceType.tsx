import { edgeApi } from "@/generated/edge-administration/api";
import { components } from "@/generated/edge-administration/types";

export type DeviceTypeCreate = components["schemas"]["DeviceTypeCreate"];

export function usePostDeviceType() {
  const mutation = edgeApi.useMutation("post", "/device-types");

  const postDeviceType = async (body: DeviceTypeCreate) => {
    return mutation.mutateAsync({ body });
  };

  return { postDeviceType, isPending: mutation.isPending };
}
