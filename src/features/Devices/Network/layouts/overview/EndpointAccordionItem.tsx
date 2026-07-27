import { useState } from "react";
import { HelpCircle, Server } from "lucide-react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EndpointStatus, Port, LastStatusChange } from "@/features/Devices/Network/components";
import { MappedEndpoint, MappedPort } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import AssignEndpointDialog from "./AssignEndpointDialog";
import AssignServiceDialog from "./AssignServiceDialog";
import BrowseDialog from "./BrowseDialog";

interface props {
  endpoint: MappedEndpoint;
  deviceId: string;
  onCreated: () => void;
  onOpenDetails: (endpointId: string) => void;
}

export default function EndpointAccordionItem({ endpoint, deviceId, onCreated, onOpenDetails }: props) {
  const isUnidentified = endpoint.source === "unidentified";
  const isConfigured = endpoint.source === "configured";

  const [assignEndpointOpen, setAssignEndpointOpen] = useState(false);
  const [assignPort, setAssignPort] = useState<MappedPort | null>(null);
  const [browsingPort, setBrowsingPort] = useState<MappedPort | null>(null);

  return (
    <AccordionItem value={endpoint.ip} className="last:border-b-0">
      <div className="flex items-center pr-4">
        <div className="flex-1">
          <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/40">
            <div className="flex items-center justify-between w-full gap-4">
              <div className="flex items-center gap-3">
                {isUnidentified ? (
                  <HelpCircle className="w-5 h-5 text-orange-500 shrink-0" />
                ) : (
                  <Server className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
                <div className="text-left">
                  <p className={isUnidentified ? "font-medium text-orange-600" : "font-medium"}>
                    {endpoint.type_label ?? "Unidentified"}
                  </p>
                  <p className="text-xs text-muted-foreground">{endpoint.ip}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <EndpointStatus value={endpoint.status} type="icon" />
              </div>
            </div>
          </AccordionTrigger>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {isConfigured ? (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(endpoint.endpoint_id as string);
              }}
            >
              Details
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setAssignEndpointOpen(true);
              }}
            >
              Assign
            </Button>
          )}
        </div>
      </div>
      <AccordionContent className="px-4">
        {endpoint.ports.length === 0 ? (
          <p className="text-xs text-muted-foreground">No services detected on this endpoint.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Status</TableHead>
                <TableHead className="w-[100px]">Port</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Last status change</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {endpoint.ports.map((port) => (
                <TableRow key={port.port}>
                  <TableCell>
                    <EndpointStatus value={port.status} type="text" />
                  </TableCell>
                  <TableCell>
                    <Port value={port.port.toString()} />
                  </TableCell>
                  <TableCell className={port.source === "unidentified" ? "text-muted-foreground" : ""}>
                    {port.type_label ?? "Unidentified"}
                  </TableCell>
                  <TableCell>
                    <LastStatusChange date={port.lastStatusChange ?? undefined} variant="outline" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {port.source !== "configured" && isConfigured && (
                        <Button variant="outline" size="sm" onClick={() => setAssignPort(port)}>
                          Assign
                        </Button>
                      )}
                      {port.browser_kind && (
                        <Button variant="outline" size="sm" onClick={() => setBrowsingPort(port)}>
                          Browse
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </AccordionContent>

      <AssignEndpointDialog
        open={assignEndpointOpen}
        onOpenChange={setAssignEndpointOpen}
        deviceId={deviceId}
        ip={endpoint.ip}
        defaultTypeId={endpoint.source === "default" ? endpoint.type_id : null}
        onCreated={onCreated}
      />

      {endpoint.endpoint_id && assignPort && (
        <AssignServiceDialog
          open={assignPort !== null}
          onOpenChange={(open) => !open && setAssignPort(null)}
          endpointId={endpoint.endpoint_id}
          port={assignPort.port}
          defaultTypeId={assignPort.source === "default" ? assignPort.type_id : null}
          onCreated={onCreated}
        />
      )}

      <BrowseDialog
        open={browsingPort !== null}
        onOpenChange={(open) => !open && setBrowsingPort(null)}
        kind={browsingPort?.browser_kind ?? null}
        ip={endpoint.ip}
        port={browsingPort?.port ?? 0}
      />
    </AccordionItem>
  );
}
