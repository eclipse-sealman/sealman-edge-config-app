import { edgeApi } from "../../api";

export default function useDeleteDefaultScanPort() {
  const mutation = edgeApi.useMutation("delete", "/network/default-scan-ports/{port}");

  const deleteDefaultScanPort = async (port: number) => {
    return mutation.mutateAsync({
      params: {
        path: { port },
      },
    });
  };

  return { deleteDefaultScanPort, isPending: mutation.isPending };
}
