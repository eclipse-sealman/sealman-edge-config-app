import { DeviceData } from "@/api/edgeConfig/edgeConfigApiHooks";
import type { components } from "@/generated/edge-administration/types";

export type DeviceWithCountryData = DeviceData & {
  countryCodeAlpha2?: string;
  countryName?: string;
  countryRegion?: string;
  continent?: string;
};

/** `endpoints` is absent when the caller isn't allowed to read endpoints. */
export type DeviceWithEndpoints = DeviceWithCountryData & {
  endpoints?: components["schemas"]["EndpointResponse"][];
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
