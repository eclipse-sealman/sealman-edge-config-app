import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useScanDiscoverStore } from "../../stores";
import { useEffect } from "react";

export default function NetworkScanResultsTable(){
  const isScanning = useScanDiscoverStore(s => s.isScanning)
  const scanResults = useScanDiscoverStore(s => s.scanResults)
  const setScanResults = useScanDiscoverStore(s => s.setScanResults)

  useEffect(() => {
    return () => {
      setScanResults([])
    }
  }, [setScanResults])

  if (isScanning) {
    return (
      <p className="text-muted-foreground flex items-center gap-4">
        <Loader2 className="animate-spin" /> Scan is in progress ...
      </p>
    )
  }

  if (scanResults.length === 0) {
    return (
      <div className="text-muted-foreground">
        <p className="mb-4">No endpoints were found.</p>
        <p>Is the device <span className="text-green-500">online</span>?</p>
        <p>Have you already performed a manual scan?</p>
        <p>Are you using the correct network prefix?</p>
        <p>Is LAN3 connected to the local network?</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>IP address</TableHead>
          <TableHead>Services running on</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {
          scanResults.map(service => (
            <TableRow key={service.ip}>
              <TableCell>{service.ip}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                {
                  Object.keys(service.ports).map(p => (
                    <Badge variant="secondary" key={p}>{ p }</Badge>
                  ))
                }
                </div>
              </TableCell>
            </TableRow>
          ))
        }
      </TableBody>
    </Table>
  )
}
