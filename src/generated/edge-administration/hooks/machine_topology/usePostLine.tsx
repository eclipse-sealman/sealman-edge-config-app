import { edgeApi } from "../../api";
import { components } from "../../types";

export type LineInput = components["schemas"]["Line-Input"];

export function usePostLine() {
  const mutation = edgeApi.useMutation("post", "/{device}/line/")

  const postLine = async({deviceId, body}: { deviceId: string, body: LineInput}) => {
    await mutation.mutateAsync({
      params: {
        path: {
          device: deviceId
        }
      },
      body,
    })
  }

  return { postLine, isPending: mutation.isPending }
}
