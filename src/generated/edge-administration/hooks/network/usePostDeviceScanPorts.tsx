import { edgeApi } from "../../api";

interface props {
  deviceId: string;
  body: { ports: number[] };
}

/**
 * Persists extra ports for this device (Overview page's "Scan Network" dialog) so they're
 * scanned automatically going forward, on top of the global default ports - see
 * OverviewContentContainer.tsx's `handleConfirmScan`.
 */
export default function usePostDeviceScanPorts() {
  const mutation = edgeApi.useMutation("post", "/{device}/network/scan-ports");

  const mutateAsync = ({ deviceId, body }: props) =>
    mutation.mutateAsync({
      body,
      params: {
        path: {
          device: deviceId,
        },
      },
    });

  return { mutateAsync, isPending: mutation.isPending };
}
