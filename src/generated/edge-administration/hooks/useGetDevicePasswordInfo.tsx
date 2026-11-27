import { useQuery } from "@tanstack/react-query";
import { ApiError, client, edgeApi } from "../api";
import { useAuth } from "@/auth";
import { isDevicePasswordEnabled } from "@/config/devicePassword";

export default function useGetDevicePasswordInfo(deviceId: string, enabled: boolean) {
  const auth = useAuth();
  const { queryKey } = edgeApi.queryOptions("get", "/{device}/password/info", {
    params: {
      path: { device: deviceId },
    },
    cache: "no-store",
  });
  return useQuery({
    queryKey: [...queryKey, auth.user?.iss, auth.user?.sub],
    queryFn: async ({ signal }) => {
      const { data, error, response } = await client.GET("/{device}/password/info", {
        params: { path: { device: deviceId } },
        signal,
        cache: "no-store",
      });
      if (error) throw new ApiError("Could not get device password information.", response.status);
      if (!data) throw new Error("The API returned no device password information.");
      return data;
    },
    enabled: isDevicePasswordEnabled() && enabled && Boolean(deviceId),
    refetchInterval: (query) => {
      const info = query.state.data;
      return query.state.status !== "error" && info?.deviceTypeHasAuthSecret && !info.error &&
        (info.forceRenewal || info.renewalTask?.status === "Pending") ? 10000 : false;
    },
  });
}
