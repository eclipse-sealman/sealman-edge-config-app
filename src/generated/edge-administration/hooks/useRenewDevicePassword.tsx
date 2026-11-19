import { edgeApi } from "../api";

export function useRenewDevicePassword() {
  return edgeApi.useMutation("post", "/{device}/password/renew", { retry: false });
}
