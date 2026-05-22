import { edgeApi } from "../../api";

interface props {
  device: string;
  module: string;
  body: {
    methodName: string,
    // TODO API SPEC: wrong type declared in the specification
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    methodPayload: Record<string, any>
  };
}

// TODO API SPEC: remove when type is fixed in the specitfication
type FixedBodyType = {
  methodName: string
  methodPayload: Record<string, never>
}

export default function usePostMethodToModuleDevice() {
  const mutation = edgeApi.useMutation("post", "/{device}/{module}/methods")

  const mutateAsync = async ({device, module, body}: props) => {
    return await mutation.mutateAsync({
      params: {
        path: {
          device,
          module
          }
        },
      // TODO API SPEC: remove cast when body type is fixed in the specification
      body: body as unknown as FixedBodyType
    })
  }

  return { mutateAsync, isPending: mutation.isPending }
}
