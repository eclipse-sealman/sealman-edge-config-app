import { useId, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EndpointStatus, LastStatusChange } from "@/features/Devices/Network/components";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import type { MappedEndpoint, MappedPort } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import type { components } from "@/generated/edge-administration/types";
import { portListKey } from "./overviewMerge";
import { type BrowseTarget, portNeedsAssignment } from "./endpointLogic";
import { PortActions } from "./endpointShared";
import { useShowConnectionState } from "./connectionStateContext";
import AssetFieldValues from "./AssetFieldValues";
import ServiceDetailsPage from "./ServiceDetailsPage";
import AssignServiceDialog from "./AssignServiceDialog";
import BrowseDialog from "./BrowseDialog";

const GuardedButton = withPermissionRequiredTooltip(Button);

interface Props {
  endpoint: MappedEndpoint;
  deviceId: string;
  services?: components["schemas"]["ServiceResponse"][];
  initialServiceId?: string | null;
  onUpdated: () => void;
}

export default function EndpointServices({ endpoint, deviceId, services, initialServiceId, onUpdated }: Props) {
  const showState = useShowConnectionState();
  const id = useId();
  const [activeKey, setActiveKey] = useState(initialServiceId ? `service:${initialServiceId}` : null);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [assignPort, setAssignPort] = useState<MappedPort | null>(null);
  const [browsing, setBrowsing] = useState<BrowseTarget | null>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());
  const servicesById = new Map(services?.map((service) => [service.service_id, service]));
  // Only network responses distinguish stored port assignments from read-time defaults.
  const ports = endpoint.ports.filter((port) => port.source !== "configured" || !services ||
    servicesById.has(port.service_id ?? ""));
  for (const service of services ?? []) {
    if (ports.some((port) => port.service_id === service.service_id)) continue;
    ports.push({
      source: "configured", status: "unknown", port: null, service_id: service.service_id,
      type_id: service.type_id, type_label: service.type_label, type_description: service.type_description,
    });
  }
  const active = ports.find((port) => portListKey(port) === activeKey) ?? ports[0];
  const selectTab = (key: string) => {
    setActiveKey(key);
    setVisited((previous) => {
      const next = new Set(previous).add(key);
      if (active) next.add(portListKey(active));
      return next;
    });
  };
  const isConfigured = endpoint.source === "configured";

  return (
    <section className="space-y-3 border-t pt-3" aria-label="Endpoint services">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-blue-700">Services</h3>
          <p className="mt-1 text-xs text-muted-foreground">Protocols exposed by this endpoint.</p>
        </div>
        {isConfigured && (
          <GuardedButton deviceId={deviceId} permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE}
            variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <Plus /> Add Service
          </GuardedButton>
        )}
      </header>
      {ports.length === 0 ? (
        <p className="rounded-md border border-dashed p-5 text-center text-sm text-muted-foreground">
          No services configured on this endpoint yet.
        </p>
      ) : (
        <div>
          <div role="tablist" aria-label="Services" className="flex overflow-x-auto border-b">
            {ports.map((port, index) => {
              const key = portListKey(port);
              const selected = key === portListKey(active);
              return (
                <button key={key} type="button" role="tab" id={`${id}-tab-${index}`}
                  aria-selected={selected} aria-controls={`${id}-panel-${index}`} tabIndex={selected ? 0 : -1}
                  ref={(node) => { if (node) tabRefs.current.set(key, node); else tabRefs.current.delete(key); }}
                  className={`-mb-px flex shrink-0 items-center gap-2 rounded-t-md border border-t-2 px-4 py-2.5 text-sm ${
                    selected ? "border-border border-b-background border-t-blue-500 bg-background font-semibold" :
                      "border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  }`}
                  onClick={() => selectTab(key)}
                  onKeyDown={(event) => {
                    let next: number;
                    if (event.key === "ArrowRight") next = (index + 1) % ports.length;
                    else if (event.key === "ArrowLeft") next = (index - 1 + ports.length) % ports.length;
                    else if (event.key === "Home") next = 0;
                    else if (event.key === "End") next = ports.length - 1;
                    else return;
                    event.preventDefault();
                    const nextKey = portListKey(ports[next]);
                    selectTab(nextKey);
                    tabRefs.current.get(nextKey)?.focus();
                  }}>
                  {showState && <span aria-label={port.status} className={`h-1.5 w-1.5 rounded-full ${
                    port.status === "online" ? "bg-green-500" : port.status === "offline" ? "bg-red-500" : "bg-orange-400"
                  }`} />}
                  {servicesById.get(port.service_id ?? "")?.type_label ?? port.type_label ?? "Unidentified"}
                  {port.port != null && <span className="font-mono text-xs font-normal text-muted-foreground">{port.port}</span>}
                  {portNeedsAssignment(port) && <span className="text-xs font-normal text-amber-700">Not assigned</span>}
                </button>
              );
            })}
          </div>
          {ports.map((port, index) => {
            const key = portListKey(port);
            const selected = key === portListKey(active);
            const service = servicesById.get(port.service_id ?? "");
            const fields = Object.fromEntries(Object.entries(port.service_data ?? {})
              .flatMap(([fieldKey, entry]) => entry.field ? [[fieldKey, entry.field]] : []));
            const values = Object.fromEntries(Object.entries(port.service_data ?? {}).map(([fieldKey, entry]) => [fieldKey, entry.value]));
            const actions = <>
              {showState && <EndpointStatus value={port.status} type="text" />}
              <PortActions endpoint={endpoint} port={port} deviceId={deviceId}
                isConfigured={isConfigured} onAssignPort={setAssignPort} onBrowse={setBrowsing} />
            </>;
            return (
              <div key={key} role="tabpanel" id={`${id}-panel-${index}`} aria-labelledby={`${id}-tab-${index}`}
                hidden={!selected} tabIndex={0} className="rounded-b-md border border-t-0 bg-background p-4">
                {(selected || visited.has(key)) && (service ? (
                  <ServiceDetailsPage service={service} deviceId={deviceId} actions={actions} onUpdated={onUpdated} />
                ) : !port.service_id && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-semibold">{port.type_label ?? "Unidentified service"}</h4>
                        <Badge variant="outline" className="border-amber-400 text-amber-700">Not assigned</Badge>
                      </div>
                      {actions}
                    </div>
                    {port.type_description && <p className="text-xs text-muted-foreground">{port.type_description}</p>}
                    <AssetFieldValues fields={fields} values={values} />
                    {!isConfigured && <p className="text-xs text-muted-foreground">Assign this endpoint before configuring its services.</p>}
                  </div>
                ))}
                {selected && showState && port.lastStatusChange && <div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                  Last status change <LastStatusChange date={port.lastStatusChange ?? undefined} variant="outline" />
                </div>}
              </div>
            );
          })}
        </div>
      )}
      {endpoint.endpoint_id && <AssignServiceDialog
        open={addOpen || assignPort !== null}
        onOpenChange={(open) => { if (!open) { setAddOpen(false); setAssignPort(null); } }}
        endpointId={endpoint.endpoint_id}
        port={assignPort?.port ?? undefined}
        defaultTypeId={assignPort?.source === "default" ? assignPort.type_id : null}
        onCreated={onUpdated}
      />}
      {browsing && <BrowseDialog open onOpenChange={(open) => { if (!open) setBrowsing(null); }} {...browsing} />}
    </section>
  );
}
