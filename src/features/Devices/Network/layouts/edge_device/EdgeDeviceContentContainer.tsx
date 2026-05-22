import {
  useNetworkPageStore,
} from "@/features/Devices/Network/stores";
import { EdgeDeviceVPNCard } from "../../smart_ems/layouts/EdgeDeviceVPNCard";
import EdgeDeviceServicesCard from "./EdgeDeviceServicesCard";

export default function EdgeDeviceContentContainer() {
  const deviceId = useNetworkPageStore((s) => s.deviceId);

  return (
    <div className="grid gap-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-1/2 relative">
          <EdgeDeviceVPNCard edgeGatewayId={deviceId} />
        </div>
        <div className="w-full sm:w-1/2">
          <EdgeDeviceServicesCard />
        </div>
      </div>
    </div>
  );
}
