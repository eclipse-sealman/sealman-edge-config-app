import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SaveTwinConfig, PerformManualNetworkScan, ReadNetworkDef, ClearPorts, PortList, AddPort, SubnetLabel, SubnetInput, NetworkPrefixLabel, NetworkPrefixInput } from "@/features/Devices/Network/components";
import { NetworkScanResultsTable } from "@/features/Devices/Network/layouts";
import { useNetworkPageStore } from "@/features/Devices/Network/stores"

export default function SetupCard() {
  const deviceId = useNetworkPageStore(s => s.deviceId)

  if(!deviceId) {
    throw new Error("Device ID must be in the route params")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Network scan setup</CardTitle>
        <CardDescription>
          You can configure or review your network settings here. To verify the accuracy of the configuration, perform a manual network scan. This will display a list of all endpoints that Edge Connect detects on the network. Note that an endpoint will only be identified if it has a service running on one of the ports you are scanning.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-5 gap-8 md:gap-8">
          <div className="md:col-span-2">
            <CardTitle>Network scan configuration</CardTitle>
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
              <AddPort />
              <div className="flex justify-end">
                <PerformManualNetworkScan/>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:col-span-3 gap-8">
            <div className="grow">
              <CardTitle>Network scan results</CardTitle>
              <NetworkScanResultsTable />
            </div>
            <div className="flex sm:justify-end">
              <SaveTwinConfig />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
