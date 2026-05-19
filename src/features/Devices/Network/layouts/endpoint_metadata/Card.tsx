import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { MachineNameCombobox, MachineNameDrawer, LastStatusChange, EndpointStatus, ClearSelectedEndpointName, ResetSelectedEndpointName, SaveTwinConfig, SelectedEndpointDescriptionInput, EndpointInfoTooltipHover, EndpointInfoTooltipClick } from "@/features/Devices/Network/components";
import { Badge } from "@/components/ui/badge";
import { useNetworkPageStore } from "@/features/Devices/Network/stores"
import useGetNetworkTopology from "@/generated/edge-administration/hooks/useGetNetworkTopology";
import useGetLineByDeviceId from "../../../../../generated/edge-administration/hooks/machine_topology/useGetLineByDeviceId";


export default function EndpointCard() {
  const deviceId = useNetworkPageStore(s => s.deviceId)
  const selectedEndpointIp = useNetworkPageStore(s => s.selectedEndpointIp)
  const { data } = useGetNetworkTopology(deviceId)

  const { data: topologyData, isLoading } = useGetLineByDeviceId(deviceId);

  let lastStatusChange = "";
  let isOnline: "offline" | "online" | "unknown" = "offline"

  const scanData = data?.scanResults
  if (scanData && selectedEndpointIp) {
    const endpointData = scanData.find(data => data.ip === selectedEndpointIp);
    if (endpointData) {
      lastStatusChange = endpointData.lastStatusChange ?? "";
      isOnline = endpointData.status
    }
  }

  const findMachineNumberByIp = (ip: string | undefined): string | undefined => {
    for (const machine of topologyData?.machines || []) {
      if (machine.endpoints && machine.endpoints.some((ep) => ep.ip === ip)) {
        return machine.machineNumber ?? undefined;
      }
    }
    return undefined;
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>
        <div className="flex justify-between">
          <h1>Endpoint</h1>
          <EndpointStatus value={isOnline} type="text"/>
        </div>
        </CardTitle>
        <CardDescription className="flex justify-between items-center">
          Information about your endpoint
          <div className="hidden sm:block">
            <EndpointInfoTooltipHover />
          </div>
          <div className="sm:hidden">
            <EndpointInfoTooltipClick />
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="grow">
        <div className="grid gap-4">
          <div className="flex space-x-4 w-full items-center">
            <div className="w-2/6">
              <p className="text-sm text-muted-foreground">Endpoint type</p>
            </div>
            <div className="w-full flex gap-1">
              <div className="w-full hidden sm:block h-full">
                <MachineNameCombobox />
              </div>
              <div className="w-full sm:hidden">
                <MachineNameDrawer />
              </div>
              <ClearSelectedEndpointName />
            </div>
          </div>
          <div className="flex w-full items-center">
            <div className="w-2/6">
              <p className="text-sm text-muted-foreground">Description</p>
            </div>
            <div className="w-full ml-4"><SelectedEndpointDescriptionInput /></div>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Machine number</p>
            <Badge variant="secondary">{ isLoading ? "Loading..." : findMachineNumberByIp(selectedEndpointIp) || "Unknown" }</Badge>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">IP address</p>
            <Badge variant="secondary">{ selectedEndpointIp }</Badge>
          </div>
          <div className="flex justify-between">
            <p className="text-sm text-muted-foreground">Last status change</p>
            <LastStatusChange variant="outline" date={lastStatusChange} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
        <ResetSelectedEndpointName />
        <SaveTwinConfig saveText="Save"/>
      </CardFooter>
    </Card>
  )
}
