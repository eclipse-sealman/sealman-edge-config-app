import SectionLayout from "@/layouts/SectionLayout";

const DEPLOYMENT_TABS = [
  { label: "Deployment Management", path: "management" },
  { label: "Deployment Operations", path: "operations" },
];

export default function DeploymentsLayout() {
  return <SectionLayout title="Deployments" tabs={DEPLOYMENT_TABS} />;
}
