import { ServiceList } from "./ServicesTable";
import { useNetworkPageStore, useSelectedEndpointStore , getPortMappingName} from "@/features/Devices/Network/stores"
import { Port, ClearSelectedEndpointServiceName, ServiceAction, ServiceNamesDrawer } from "@/features/Devices/Network/components"
import useGetNetworkTopology from "../../../../../generated/edge-administration/hooks/useGetNetworkTopology";

export default function MobileServicesTable() {
  const deviceId = useNetworkPageStore(s => s.deviceId)
  const { data } = useGetNetworkTopology(deviceId)
  const selectedEndpointIp = useNetworkPageStore(s => s.selectedEndpointIp)
  const services = useSelectedEndpointStore(s => s.services)

  // Obtain the list of ports with services from the periodic scan result
  let resultList: ServiceList = {}
  const scanData = data?.scanResults
  if (scanData && selectedEndpointIp) {
    const endpointData = scanData.find(data => data.ip === selectedEndpointIp);
    if (endpointData) {
      resultList = endpointData.ports;
    }
  }

  return (
    <div className="grid gap-2">
      {resultList && Object.keys(resultList).map(port => (
        <div className="grid grid-cols-12 gap-2 items-center" key={port}>
          {/* <div className="col-span-1">
            <Status value={v.status} />
          </div> */}
          <div className="col-span-6 flex gap-1">
            <ServiceNamesDrawer name={getPortMappingName(port , services) || "Select Name..."} port={Number(port)} />
            <ClearSelectedEndpointServiceName port={Number(port)}/>
          </div>
          <div className="col-span-2">
            <Port value={port} />
          </div>
          <div className="col-span-4 text-end">
            <ServiceAction name={services[port]} />
            {/* <LastStatusChange date={v.lastStatusChange}/> */}
          </div>
        </div>
      ))}
    </div>
  )
}
