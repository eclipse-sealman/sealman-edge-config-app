import { edgeApi } from "../../api";
import { components } from "../../types";
import { getDevicesWithCountryData } from "./getDevicesWithCountryData";

const queryOptions = edgeApi.queryOptions("get", "/devices");

const devicesWithCountryDataQueryOptions = {
  ...queryOptions,
  // modify query key so that transformed data is cached under different key
  queryKey: ["get", "/devices", "withCountryData"],
};

devicesWithCountryDataQueryOptions.queryFn = async (context): Promise<any> => {
  // call the original fetcher function
  const data: components["schemas"]["DeviceStatusWithConnection"][] = await queryOptions.queryFn(context);

  // transform the data
  const devicesWithCountryData = getDevicesWithCountryData(data);
  return devicesWithCountryData;
};

export default function useGetDevices() {
  const devicesQuery = edgeApi.useQuery("get", "/devices", {}, devicesWithCountryDataQueryOptions);
  return devicesQuery;
}
