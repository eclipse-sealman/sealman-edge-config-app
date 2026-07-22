import { edgeApi } from "@/generated/edge-administration/api";

export default function useGetServiceTypes() {
  return edgeApi.useQuery("get", "/service-types");
}
