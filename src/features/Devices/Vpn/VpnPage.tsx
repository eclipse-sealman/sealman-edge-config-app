import { useState } from "react";
import SubTabs from "@/components/Navigation/SubTabs";
import { Authorization } from "../Network/smart_ems/layouts/Authorization";
import VpnConnectionsTab from "./VpnConnectionsTab";

const TABS = [
  { id: "auth", label: "VPN Auth" },
  { id: "connections", label: "VPN Connections" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function VpnPage({ deviceId }: { deviceId: string }) {
  const [activeTab, setActiveTab] = useState<TabId>("auth");

  return (
    <div className="space-y-4">
      <SubTabs tabs={TABS} active={activeTab} onChange={setActiveTab} />
      {activeTab === "auth" ? <Authorization /> : <VpnConnectionsTab deviceId={deviceId} />}
    </div>
  );
}
