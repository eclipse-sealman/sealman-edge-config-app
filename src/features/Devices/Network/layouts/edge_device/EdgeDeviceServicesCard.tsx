
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EdgeDeviceServicesTable from "./EdgeDeviceServicesTable";

export default function EdgeDeviceServicesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Services
        </CardTitle>
        <CardDescription>
          A list of the services running on the edge device. Press the browse button to navigate to the service.
        </CardDescription>
      </CardHeader>
      <CardContent>
          {/* <div className="sm:hidden">
            // Mobile version not implemented, as this section is not meant to be used on mobile 
            <EdgeDeviceServicesTable/>
          </div>
          <div className="hidden sm:block h-full">
            <EdgeDeviceServicesTable/>
          </div> */}

          <EdgeDeviceServicesTable/>
      </CardContent>
    </Card>
  );
}
