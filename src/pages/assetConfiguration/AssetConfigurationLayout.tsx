import SectionLayout from "@/layouts/SectionLayout";

const ASSET_CONFIGURATION_TABS = [
  { label: "Asset Types", path: "asset-types" },
  { label: "Templates", path: "templates" },
];

export default function AssetConfigurationLayout() {
  return <SectionLayout title="Asset Configuration" tabs={ASSET_CONFIGURATION_TABS} />;
}
