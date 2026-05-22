import { Button } from "@/components/ui/button";
import { GearIcon } from "@radix-ui/react-icons";
import EndpointSelector from "./drawer";
import { NetworkScanConfigSheet } from "@/features/Devices/Network/layouts";
import { RefetchPeriodicScan } from "../periodic_scan";

// TODO: move to layout
export default function MobileLayout() {

  return (
    <div className="flex gap-1">
      <EndpointSelector/>
      <RefetchPeriodicScan/>
      <NetworkScanConfigSheet
        trigger={(
          <Button id="scan-definition-dialog-open" variant="outline" size="icon">
            <GearIcon />
          </Button>
        )}
      />
    </div>
  )
}
