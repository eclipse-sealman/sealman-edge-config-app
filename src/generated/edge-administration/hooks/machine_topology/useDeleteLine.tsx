import { edgeApi } from "../../api";

export function useDeleteLine() {
  const mutation = edgeApi.useMutation("delete", "/{device}/line/")

  const deleteLine = async({deviceId}: { deviceId: string }) => {
    await mutation.mutateAsync({
      params: {
        path: {
          device: deviceId
        }
      }
    })
  }

  return { deleteLine, isPending: mutation.isPending }
}
