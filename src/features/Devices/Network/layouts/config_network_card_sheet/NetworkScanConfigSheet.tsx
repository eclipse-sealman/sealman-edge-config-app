import { Sheet, SheetContent, SheetTrigger, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ReactNode, useState } from "react";
import { PerformManualNetworkScan, ClearPorts, PortList, AddPort, SubnetLabel, SubnetInput, NetworkPrefixLabel, NetworkPrefixInput, ResetScanConfiguration, ReadNetworkDef, SaveTwinConfig } from "@/features/Devices/Network/components";
import { NetworkScanResultsTable } from "@/features/Devices/Network/layouts"

interface props {
  trigger: ReactNode
}

export default function NetworkScanConfigSheet({ trigger }: props) {
  const [open, setOpen ] = useState(false)

  return (
    <Sheet open={ open } onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <span>{trigger}</span>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[500px] max-w-(--breakpoint-lg)! overflow-y-scroll mt-[64px]">
          <SheetHeader className="text-start">
            <SheetTitle>Network scan configuration</SheetTitle>
            <SheetDescription>
              You can configure or review your network settings here. To verify the accuracy of the configuration, perform a manual network scan. This will display a list of all endpoints that Edge Connect detects on the network. Note that an endpoint will only be identified if it has a service running on one of the ports you are scanning.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4">
            <NetworkPrefixLabel />
            <NetworkPrefixInput />
            <SubnetLabel />
            <SubnetInput />
            <div className="flex justify-end">
            <ReadNetworkDef/>
            </div>
            <div className="flex justify-between items-center">
              <h4 className="text-base font-semibold tracking-tight">Ports to scan</h4>
              <ClearPorts />
            </div>
            <PortList />
            <div className="flex flex-wrap items-start justify-end gap-2">
              <div className="min-w-[240px] flex-1">
                <AddPort />
              </div>
              <ResetScanConfiguration />
              <PerformManualNetworkScan/>
            </div>
            <div>
              <SheetTitle>Manual scan results</SheetTitle>
              <NetworkScanResultsTable />
              <div className="flex justify-end mb-16 mt-4">
                <SaveTwinConfig onSuccess={() => setOpen(false)}/>
              </div>
            </div>
          </div>
      </SheetContent>
    </Sheet>
  )
}
