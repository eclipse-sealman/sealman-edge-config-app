import clm from "country-locale-map";
import { DeviceData } from "@/api/edgeConfig/edgeConfigApiHooks";
import { DeviceWithCountryData } from "./useGetDevices.types";

export const getDevicesWithCountryData = (devices: DeviceData[]): DeviceWithCountryData[] => {
  const outputList: DeviceWithCountryData[] = [];

  devices.forEach((device) => {
    const deviceWithCountryData: DeviceWithCountryData = {
      ...device,
    };
    const countryCode = device.deviceMetadata?.countryCode?.value as string | undefined;
    if (countryCode) {
      const country = countryCode.length === 3 ? clm.getCountryByAlpha3(countryCode) : clm.getCountryByAlpha2(countryCode);
      if (!country) {
        outputList.push(deviceWithCountryData);
        return;
      }
      deviceWithCountryData.countryCodeAlpha2 = country.alpha2?.toLowerCase();
      deviceWithCountryData.countryName = country.name;
      deviceWithCountryData.countryRegion = country.region;
      deviceWithCountryData.continent = country.continent;
    }
    outputList.push(deviceWithCountryData);
  });
  return outputList;
};
