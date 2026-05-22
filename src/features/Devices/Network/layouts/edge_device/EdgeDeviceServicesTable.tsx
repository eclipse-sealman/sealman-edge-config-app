import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Port } from "@/features/Devices/Network/components"
import EdgeDeviceServiceBrowse from "../../components/buttons/actions/EdgeDeviceServiceBrowse";
import { useEdgeDeviceServicesStore } from "../../stores";

const servicesList = [
  { port: 80, name: "Web UI" },
  { port: 88, name: "Landing page" },
  { port: 9090, name: "Connection check" },
];

export default function EdgeDeviceServicesTable() {
  const isConnected = useEdgeDeviceServicesStore(s => s.isconnected)
  const ipAddress = useEdgeDeviceServicesStore(s => s.ipAddress)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Port</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Browse</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {servicesList.map((service) => (
          <TableRow key={service.port}>
            <TableCell>
              <Port value={service.port.toString()} />
            </TableCell>
            <TableCell>
              {service.name}
            </TableCell>
            <TableCell>
              <EdgeDeviceServiceBrowse ip={ipAddress} port={service.port} disabled={!isConnected} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
