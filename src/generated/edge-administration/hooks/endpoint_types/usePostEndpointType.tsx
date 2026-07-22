import { edgeApi } from "@/generated/edge-administration/api";
import { components } from "@/generated/edge-administration/types";

export type EndpointTypeCreate = components["schemas"]["EndpointTypeCreate"];

export function usePostEndpointType() {
  const mutation = edgeApi.useMutation("post", "/endpoint-types");

  const postEndpointType = async (body: EndpointTypeCreate) => {
    return mutation.mutateAsync({ body });
  };

  return { postEndpointType, isPending: mutation.isPending };
}
