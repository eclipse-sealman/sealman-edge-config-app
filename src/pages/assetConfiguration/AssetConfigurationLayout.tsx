import SectionLayout from "@/layouts/SectionLayout";

const ASSET_CONFIGURATION_TABS = [
  { label: "Device Types", path: "device-types" },
  { label: "Endpoint Types", path: "endpoint-types" },
  { label: "Service Types", path: "service-types" },
];

export default function AssetConfigurationLayout() {
  return <SectionLayout title="Asset Configuration" tabs={ASSET_CONFIGURATION_TABS} />;
}
