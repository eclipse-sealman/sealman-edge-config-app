import { edgeApi } from "../../api";
import { LineInput } from "./usePostLine";

export function useUpdateLine() {
  const mutation = edgeApi.useMutation("put", "/{device}/line/")

  const updateLine = async({deviceId, body}: {deviceId: string, body: LineInput}) => {
    await mutation.mutateAsync({
      params: {
        path: {
          device: deviceId
        }
      },
      body,
    })
  }

  return { updateLine, isPending: mutation.isPending }
}
