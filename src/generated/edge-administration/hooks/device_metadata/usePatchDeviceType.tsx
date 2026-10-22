import { edgeApi } from "@/generated/edge-administration/api";
import { components } from "@/generated/edge-administration/types";

export type DeviceRetypeRequest = components["schemas"]["DeviceRetypeRequest"];

export default function usePatchDeviceType() {
  const mutation = edgeApi.useMutation("patch", "/{device}/type");

  const patchDeviceType = async ({ deviceId, body }: { deviceId: string; body: DeviceRetypeRequest }) =>
    mutation.mutateAsync({
      params: { path: { device: deviceId } },
      body,
    });

  return { patchDeviceType, isPending: mutation.isPending };
}
