
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import MobileServicesTable from "./MobileServicesTable";
import { ResetSelectedEndpointServicesState, SaveTwinConfig} from "@/features/Devices/Network/components";
import ServicesTable from "./ServicesTable";
import { useNetworkPageStore } from "@/features/Devices/Network/stores"

export default function ServicesCard() {
  const selectedEndpointIp = useNetworkPageStore(s => s.selectedEndpointIp)

  if (!selectedEndpointIp) {
    throw new Error("Selected endpoint IP must be defined")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Services
        </CardTitle>
        <CardDescription>
          A list of the services running on the machine. If a service is not listed make sure its port is included in the scanned ports
        </CardDescription>
      </CardHeader>
      <CardContent>
          <div className="sm:hidden">
            <MobileServicesTable/>
          </div>
          <div className="hidden sm:block h-full">
            <ServicesTable/>
          </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
        <ResetSelectedEndpointServicesState />
        <SaveTwinConfig saveText="Save"/>
      </CardFooter>
    </Card>
  );
}
