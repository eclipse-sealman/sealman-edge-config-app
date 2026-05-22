import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { components } from "@/generated/edge-administration/types";
import { EndpointStatus, Port, ClearSelectedEndpointServiceName, ServiceNamesCombobox, LastStatusChange, ServiceAction } from "@/features/Devices/Network/components"
import useGetNetworkTopology from "../../../../../generated/edge-administration/hooks/useGetNetworkTopology";
import { useNetworkPageStore, useSelectedEndpointStore , getPortMappingName  } from "@/features/Devices/Network/stores"
export interface ServiceList {
  [key: string]: components["schemas"]["PortStatus"]
}

export default function ServicesTable() {
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
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">
              Status
            </TableHead>
            <TableHead className="w-[100px]">Port</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Last status change</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resultList && Object.keys(resultList).map(port => (
            // <Row port={key} status={resultList[key].status} lastStatusChange={resultList[key].lastStatusChange} />
            <TableRow key={port}>
              <TableCell className="">
                <EndpointStatus value={resultList[port].status}/>
              </TableCell>
              <TableCell>
                <Port value={port} />
              </TableCell>
              <TableCell className="flex gap-1">
                <ServiceNamesCombobox name={getPortMappingName(port , services) || "Select name..."} port={Number(port)}/>
                <ClearSelectedEndpointServiceName port={Number(port)}/>
              </TableCell>
              <TableCell>
                <LastStatusChange date={resultList[port].lastStatusChange ?? undefined} variant={"outline"} />
              </TableCell>
              <TableCell>
                <ServiceAction name={services[port]} disabled={resultList[port].status != "online"} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
