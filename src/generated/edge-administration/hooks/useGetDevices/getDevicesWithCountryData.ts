import clm from "country-locale-map";
import { components } from "@/generated/edge-administration/types";
import { DeviceWithCountryData, DeviceWithTypedMetadata } from "./useGetDevices.types";

export const getDevicesWithCountryData = (
  devices: components["schemas"]["DeviceStatusWithConnection"][]
): DeviceWithCountryData[] => {
  const outputList: DeviceWithCountryData[] = [];

  const typedDevices = devices as DeviceWithTypedMetadata[];
  typedDevices.forEach((device) => {
    const deviceWithCountryData: DeviceWithCountryData = {
      ...device,
    };
    if (device.deviceMetadata?.countryCode?.value) {
      const countryCode = device.deviceMetadata.countryCode.value;
      const country = countryCode.length === 3 ? clm.getCountryByAlpha3(countryCode) : clm.getCountryByAlpha2(countryCode);
      if (!country) {
        outputList.push(deviceWithCountryData);
        return;
      }
      deviceWithCountryData.countryCodeAlpha2 = country.alpha2?.toLowerCase();
      deviceWithCountryData.countryName = country.name;
      deviceWithCountryData.countryRegion = country.region;
      deviceWithCountryData.continent = country.continent;

      if (device.deviceMetadata?.geoLocation?.value) {
        const latitude = Number(device.deviceMetadata.geoLocation.value.split(",")[0]);
        const longitude = Number(device.deviceMetadata.geoLocation.value.split(",")[1]);

        if (isNaN(latitude) || isNaN(longitude)) {
          deviceWithCountryData.geoLocation = undefined;
        }
      }
    }
    outputList.push(deviceWithCountryData);
  });
  return outputList;
};
