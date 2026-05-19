import { edgeApi } from "@/generated/edge-administration/api";

export default function useGetDeviceMetadata(device: string) {
  const query = edgeApi.useQuery("get", "/{device}/metadata", {
    params: {
      path: {
        device
      },
    },
  });

  return query;
}
