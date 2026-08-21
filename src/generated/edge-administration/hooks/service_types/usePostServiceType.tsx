import { edgeApi } from "@/generated/edge-administration/api";
import { components } from "@/generated/edge-administration/types";

export type ServiceTypeCreate = components["schemas"]["ServiceTypeCreate"];

export function usePostServiceType() {
  const mutation = edgeApi.useMutation("post", "/service-types");

  const postServiceType = async (body: ServiceTypeCreate) => {
    return mutation.mutateAsync({ body });
  };

  return { postServiceType, isPending: mutation.isPending };
}
