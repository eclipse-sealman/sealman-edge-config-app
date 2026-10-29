import { edgeApi } from "@/generated/edge-administration/api";

export default function useGetComposeDeploymentStatus(deviceId: string) {
  return edgeApi.useQuery(
    "get",
    "/{device}/compose-deployment/status",
    { params: { path: { device: deviceId } } },
    { refetchInterval: 30000, enabled: Boolean(deviceId) },
  );
}
