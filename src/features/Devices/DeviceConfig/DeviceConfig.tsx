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
    <div className="space-y-4">
      <SmartEmsStatus />
      <Heading><CommandLineIcon className="w-7 h-7 mr-1" />Configuration Commands</Heading>
      <div className="flex flex-row space-x-2">
        <DeviceSemsConfigExport />
        <DeviceSemsCheck />
      </div>
      <Heading><WrenchScrewdriverIcon className="w-7 h-7 mr-1" />Interface Configuration</Heading>
      <DeviceIpSetup />
      <Cellular />
      <DeviceNatConfigProvided />
      <PortForwardingConfigProvider deviceId={deviceId}>
        <PortForwardingConfig />
        <SavePortForwardingConfig deviceId={deviceId} />
      </PortForwardingConfigProvider>
    </div>
  );
}
