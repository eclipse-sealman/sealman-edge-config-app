import { UserComputer } from "./icons/UserComputer";
import { SmartEMSVPN } from "./icons/SmartEMSVPN";
import { Device } from "./icons/Device";
import { Connected } from "./icons/Connected";


export const Hint = () => {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-1 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-primary">
              <UserComputer />
            </span>
            Your computer
          </div>
          <div className="col-span-1 flex items-center gap-2">
            <span className="text-primary">
              <SmartEMSVPN />
            </span>
            The Smart EMS VPN
          </div>
          <div className="col-span-1 flex items-center gap-2">
            <span className="text-primary">
              <Device />
            </span>
            The endpoint
          </div>
        </div>
        <div className="col-span-1 space-y-2">
          <div className=" flex items-center gap-2">
            <Connected isConnected={true} />
            VPN is connected
          </div>
          <div className=" flex items-center gap-2">
            <Connected isConnected={false} />
            No active VPN connection
          </div>
        </div>
      </div>
    </div>
  )
};
