import { DeviceData } from "@/api/edgeConfig/edgeConfigApiHooks";

export type DeviceWithCountryData = DeviceData & {
  countryCodeAlpha2?: string;
  countryName?: string;
  countryRegion?: string;
  continent?: string;
};

export type DeviceMetadataValue = {
  value?: string;
  source: string;
};

export type DeviceMetadata = {
  city?: DeviceMetadataValue;
  customer?: DeviceMetadataValue;
  countryCode?: DeviceMetadataValue;
  geoLocation?: DeviceMetadataValue;
  businessUnit?: DeviceMetadataValue;
  [key: string]: DeviceMetadataValue | undefined; // for additional props
};
