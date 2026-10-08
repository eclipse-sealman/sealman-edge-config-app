import { useState } from "react";
import SubTabs from "@/components/Navigation/SubTabs";
import DeploymentInfo from "./DeploymentInfo";
import ModuleList from "./ModuleList";

const TABS = [
  { id: "applications", label: "Applications" },
  { id: "deployments", label: "Deployments" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ApplicationsTab() {
  const [activeTab, setActiveTab] = useState<TabId>("applications");

  return (
    <div className="space-y-4">
      <SubTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {activeTab === "applications" ? <ModuleList /> : <DeploymentInfo />}
    </div>
  );
}
