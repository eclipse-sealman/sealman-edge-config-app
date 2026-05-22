import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMenuStore } from "../../stores";
import { MACHINE_TYPES } from "../../endpoint_and_machine_types";
import { Badge } from "@/components/ui/badge";

export default function SelectedMachineInfo() {
  const selectedMachineType = useMenuStore((state) => state.selectedMachineType)

  const endpoints = MACHINE_TYPES.find((f) => f.name === selectedMachineType)?.endpoints ?? undefined

  return (
    endpoints && <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">IP</TableHead>
          <TableHead className="w-[100px]">Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {endpoints.map(endpoint => (
          // <Row port={key} status={resultList[key].status} lastStatusChange={resultList[key].lastStatusChange} />
          <TableRow key={endpoint.ip}>
            <TableCell>
              <Badge variant="secondary">{endpoint.ip}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{endpoint.name}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}