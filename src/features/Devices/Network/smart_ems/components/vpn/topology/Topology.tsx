import { Connected } from "./icons/Connected";
import { Device } from "./icons/Device";
import { SmartEMSVPN } from "./icons/SmartEMSVPN";
import { UserComputer } from "./icons/UserComputer";


interface props {
  isComputerConnected: boolean;
  isDeviceConnected: boolean;
}

export const Topology = ({ isDeviceConnected, isComputerConnected }: props) => {
  return (
    <div className="space-y-2">
      <div className="flex gap-4">
        <UserComputer />
        <Connected isConnected={isComputerConnected} />
        <SmartEMSVPN />
        <Connected isConnected={isDeviceConnected} />
        <Device />
      </div>
    </div>
  );
};
