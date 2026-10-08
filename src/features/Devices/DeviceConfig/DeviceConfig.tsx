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
import { useParams } from "react-router-dom";


export default function DeviceConfig() {
  const { deviceId } = useParams<{ deviceId: any }>();
  return (
    <div className="space-y-6">
      <SmartEmsStatus />

      <div>
        <Heading description="Export the Smart-EMS configuration or activate a pending config update.">
          <CommandLineIcon className="w-5 h-5" />Configuration Commands
        </Heading>
        <div className="bg-card border rounded-lg p-4 flex flex-row flex-wrap gap-2">
          <DeviceSemsConfigExport />
          <DeviceSemsCheck />
        </div>
      </div>

      <div>
        <Heading description="Network interfaces of the Smart-EMS.">
          <WrenchScrewdriverIcon className="w-5 h-5" />Interface Configuration
        </Heading>
        <div className="bg-card border rounded-lg p-4 space-y-4 [&>*:empty]:hidden">
          <DeviceIpSetup />
          <Cellular />
        </div>
      </div>

      <DeviceNatConfigProvided />

      <PortForwardingConfigProvider deviceId={deviceId}>
        <PortForwardingConfig>
          <SavePortForwardingConfig deviceId={deviceId} />
        </PortForwardingConfig>
      </PortForwardingConfigProvider>
    </div>
  );
}
