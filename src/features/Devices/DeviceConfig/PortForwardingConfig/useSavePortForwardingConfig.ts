import { edgeApi } from "src/generated/edge-administration/api";

export const useSavePortForwardingConfig = () =>
  edgeApi.useMutation(
    "post",
    "/{device}/smartems/config/port-forwarding"
  );
