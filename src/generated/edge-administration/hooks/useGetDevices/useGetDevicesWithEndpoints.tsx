import { useEffect, useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { client } from "../../api";
import { DeviceData } from "@/api/edgeConfig/edgeConfigApiHooks";
import { getDevicesWithCountryData } from "./getDevicesWithCountryData";
import { DeviceWithEndpoints } from "./useGetDevices.types";

export const DEVICES_PAGE_SIZE = 200;

/**
 * All devices including their endpoints, fetched page by page so no single request grows with
 * the fleet size. Further pages load automatically in the background; `data` grows as they arrive.
 */
export default function useGetDevicesWithEndpoints() {
  const query = useInfiniteQuery({
    // Shares the ["get", "/devices"] prefix so existing device invalidations also refresh this.
    queryKey: ["get", "/devices", "withEndpoints"],
    initialPageParam: 0,
    queryFn: async ({ pageParam }): Promise<DeviceWithEndpoints[]> => {
      const { data } = await client.GET("/devices", {
        params: { query: { include_endpoints: true, limit: DEVICES_PAGE_SIZE, offset: pageParam } },
      });
      return getDevicesWithCountryData((data ?? []) as DeviceData[]) as DeviceWithEndpoints[];
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < DEVICES_PAGE_SIZE ? undefined : allPages.length * DEVICES_PAGE_SIZE,
  });

  const { hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = query;

  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage && !isFetchNextPageError) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage]);

  const data = useMemo(() => query.data?.pages.flat(), [query.data]);

  return {
    data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isLoadingMore: hasNextPage || isFetchingNextPage,
  };
}
