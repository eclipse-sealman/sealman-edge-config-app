import { edgeApi } from "@/generated/edge-administration/api";

export default function useGetEndpointTypes() {
  return edgeApi.useQuery("get", "/endpoint-types");
}
