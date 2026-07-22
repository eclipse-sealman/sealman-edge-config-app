import { useQuery } from "@tanstack/react-query";
import { edgeApi } from "../../api";
import { DeviceData } from "@/api/edgeConfig/edgeConfigApiHooks";
import { getDevicesWithCountryData } from "./getDevicesWithCountryData";
import { DeviceWithCountryData } from "./useGetDevices.types";

const queryOptions = edgeApi.queryOptions("get", "/devices");

export default function useGetDevices() {
  return useQuery<DeviceWithCountryData[]>({
    queryKey: ["get", "/devices", "withCountryData"],
    queryFn: async (context) => {
      // call the original fetcher function (queryKey differs only by a phantom type tag, safe to reuse the context)
      const data = (await queryOptions.queryFn(
        context as Parameters<typeof queryOptions.queryFn>[0],
      )) as DeviceData[];

      // transform the data
      return getDevicesWithCountryData(data);
    },
  });
}
