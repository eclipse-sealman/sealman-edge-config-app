import { edgeApi } from "@/generated/edge-administration/api";
import { components } from "@/generated/edge-administration/types";

export type EndpointCreate = components["schemas"]["EndpointCreate"];

export function usePostEndpoint() {
  const mutation = edgeApi.useMutation("post", "/endpoints");

  const postEndpoint = async ({ deviceId, body }: { deviceId: string; body: EndpointCreate }) => {
    return mutation.mutateAsync({
      params: {
        query: { device_id: deviceId },
      },
      body,
    });
  };

  return { postEndpoint, isPending: mutation.isPending };
}
