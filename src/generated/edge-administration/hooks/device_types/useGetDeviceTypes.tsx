import { edgeApi } from "@/generated/edge-administration/api";

export default function useGetDeviceTypes() {
  return edgeApi.useQuery("get", "/device-types");
}
