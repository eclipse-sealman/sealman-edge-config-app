import { edgeApi } from "../../api";
import { components } from "../../types";

export type DefaultScanPortCreate = components["schemas"]["DefaultScanPortCreate"];

export default function usePostDefaultScanPort() {
  const mutation = edgeApi.useMutation("post", "/network/default-scan-ports");

  const postDefaultScanPort = async (body: DefaultScanPortCreate) => {
    return mutation.mutateAsync({ body });
  };

  return { postDefaultScanPort, isPending: mutation.isPending };
}
