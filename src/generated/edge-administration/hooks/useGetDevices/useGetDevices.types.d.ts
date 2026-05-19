import { components } from "@/generated/edge-administration/types";

export type DeviceWithCountryData = components["schemas"]["DeviceStatus"] & {
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

export interface DeviceWithTypedMetadata extends Omit<components["schemas"]["DeviceStatusWithConnection"], "deviceMetadata"> {
  deviceMetadata: DeviceMetadata;
}

