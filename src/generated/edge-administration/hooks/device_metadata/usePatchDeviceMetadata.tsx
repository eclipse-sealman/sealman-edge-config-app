import { edgeApi } from "@/generated/edge-administration/api";

export default function usePatchDeviceMetadata() {
  const mutation = edgeApi.useMutation("patch", "/{device}/metadata")

  const query = async({deviceId, body}: {deviceId: string, body: { [key: string]: unknown }}) => {
    await mutation.mutateAsync({
      params: {
        path: { device: deviceId },
      },
      body,
    })
  }

  return { query, isPending: mutation.isPending, isError: mutation.isError, error: mutation.error};
}