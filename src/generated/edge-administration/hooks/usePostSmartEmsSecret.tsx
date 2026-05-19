import { edgeApi } from "../api";

export function usePostSmartEmsSecret() {
  const mutation = edgeApi.useMutation("post", "/{device}/smartems/secret/renew");

  const postDeviceSmartEmsSecret = async ({ deviceId, onSuccess }: { deviceId: string; onSuccess: () => void }) => {
    await mutation.mutateAsync(
      {
        params: {
          path: {
            device: deviceId,
          },
        },
      },
      {
        onSuccess: () => {
          onSuccess();
        },
      }
    );
  };

  return {
    postDeviceSmartEmsSecret,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
