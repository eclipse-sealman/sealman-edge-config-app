import { edgeApi } from "@/generated/edge-administration/api";

export default function useGetService(serviceId: string) {
  return edgeApi.useQuery("get", "/services/{service_id}", {
    params: {
      path: { service_id: serviceId },
    },
  });
}
