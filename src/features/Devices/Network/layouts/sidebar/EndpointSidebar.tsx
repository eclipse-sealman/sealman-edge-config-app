import { Button } from "@/components/ui/button";
import { NetworkScanConfigSheet } from  "@/features/Devices/Network/layouts";
import { EndpointList } from "@/features/Devices/Network/layouts";
import { GearIcon } from "@radix-ui/react-icons";
import { RefetchPeriodicScan, ScanDataInfo, SearchEndpoint } from "@/features/Devices/Network/components";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConnectAllProvided } from "../../smart_ems/components/vpn/endpoint_device_shortcuts/ConnectAll";

export default function EndpointSidebar() {
  return (
    <div className="h-full">
      <div className="h-12">
        <div className="h-full flex items-center gap-2">
          <div className="w-full">
            <SearchEndpoint />
          </div>
          <div className="flex justify-end gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <RefetchPeriodicScan/>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refetch periodic scan data</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <NetworkScanConfigSheet
            trigger={(
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button id="scan-definition-dialog-open" variant="outline" size="icon">
                      <GearIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure network scan</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          />
          </div>
        </div>
      </div>
      <div className="flex justify-between p-1 items-center">
        <ScanDataInfo />
        {/* TODO: Could add a popover to provide more functionalities if needed*/}
        <ConnectAllProvided />
      </div>
      <EndpointList />
    </div>
  );
}
