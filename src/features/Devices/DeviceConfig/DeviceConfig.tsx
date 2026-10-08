import DeviceIpSetup from "./DeviceIpSetup";
import { Heading } from "../../../components/Typography/Heading";
import { WrenchScrewdriverIcon, CommandLineIcon } from "@heroicons/react/24/outline";
import SmartEmsStatus from './SmartEmsStatus';
import { DeviceSemsCheck } from "./DeviceSemsCheck";
import { Cellular } from "./DeviceCellularConfig";
import { DeviceSemsConfigExport } from "./SmartEmsConfigExport";
import DeviceNatConfigProvided from "./NatConfig/DeviceNatConfigProvided";
import PortForwardingConfigProvider from "./PortForwardingConfig/provider";
import PortForwardingConfig from "./PortForwardingConfig/PortForwardingConfig";
import SavePortForwardingConfig from "./PortForwardingConfig/SavePortForwardingConfig";
import { useState } from "react";
import { useParams } from "react-router-dom";
import SubTabs from "@/components/Navigation/SubTabs";
import SecurityInformation from "../DeviceInfo/Security/SecurityInformation";

const TABS = [
  { id: "configuration", label: "Configuration Information" },
  { id: "security", label: "Device Security" },
  { id: "interfaces", label: "Interface Configuration" },
  { id: "nat", label: "1:1 NAT Configuration" },
  { id: "port-forwarding", label: "Port Forwarding" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function DeviceConfig() {
  const { deviceId } = useParams<{ deviceId: any }>();
  const [activeTab, setActiveTab] = useState<TabId>("configuration");

  // All panels stay mounted and are only hidden, so unsaved edits survive switching tabs.
  const panelClass = (id: TabId) => (activeTab === id ? "space-y-6" : "hidden");

  return (
    <div className="space-y-4">
      <SubTabs tabs={TABS} active={activeTab} onChange={setActiveTab} actions={<DeviceSemsCheck />} />

      <div className={panelClass("configuration")}>
        <SmartEmsStatus />

        <div>
          <Heading description="Show the desired or the currently active Smart-EMS configuration.">
            <CommandLineIcon className="w-5 h-5" />Configuration Commands
          </Heading>
          <div className="bg-card border rounded-lg p-4 flex flex-row flex-wrap gap-2">
            <DeviceSemsConfigExport />
          </div>
        </div>
      </div>

      <div className={panelClass("security")}>
        <SecurityInformation />
      </div>

      <div className={panelClass("interfaces")}>
        <div>
          <Heading description="Network interfaces of the Smart-EMS.">
            <WrenchScrewdriverIcon className="w-5 h-5" />Interface Configuration
          </Heading>
          <div className="bg-card border rounded-lg p-4 space-y-4 [&>*:empty]:hidden">
            <DeviceIpSetup />
            <Cellular />
          </div>
        </div>
      </div>

      <div className={panelClass("nat")}>
        <DeviceNatConfigProvided />
      </div>

      <div className={panelClass("port-forwarding")}>
        <PortForwardingConfigProvider deviceId={deviceId}>
          <PortForwardingConfig>
            <SavePortForwardingConfig deviceId={deviceId} />
          </PortForwardingConfig>
        </PortForwardingConfigProvider>
      </div>
    </div>
  );
}
