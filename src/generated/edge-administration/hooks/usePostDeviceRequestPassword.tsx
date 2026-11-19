import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError, client, edgeApi } from "../api";
import type { components } from "../types";
import { isDevicePasswordEnabled } from "@/config/devicePassword";

export default function usePostDeviceRequestPassword(device: string) {
  const [password, setPassword] = useState<components["schemas"]["DeviceSecretValue"] | null>(null);
  const controller = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["revealDevicePassword", device],
    // Only local dialog state receives plaintext; the mutation's cached result is void.
    mutationFn: async ({ signal }: { signal: AbortSignal }) => {
      if (!isDevicePasswordEnabled()) throw new Error("Device passwords are disabled.");
      const { data, error, response } = await client.POST("/{device}/password/request", {
        params: { path: { device } },
        signal,
        cache: "no-store",
      });
      if (error) throw new ApiError("Could not request the device password.", response.status);
      if (!data) throw new Error("The API returned no device password.");
      if (!signal.aborted) setPassword(data);
    },
    gcTime: 0,
    retry: false,
    meta: { skipGlobalInvalidate: true },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: edgeApi.queryOptions("get", "/{device}/password/info", {
          params: { path: { device } },
        }).queryKey,
      });
    },
  });

  useEffect(() => () => controller.current?.abort(), []);

  const reset = () => {
    controller.current?.abort();
    setPassword(null);
    mutation.reset();
  };

  const request = () => {
    reset();
    controller.current = new AbortController();
    mutation.mutate({ signal: controller.current.signal });
  };

  return { password, request, reset, isPending: mutation.isPending, error: mutation.error };
}
