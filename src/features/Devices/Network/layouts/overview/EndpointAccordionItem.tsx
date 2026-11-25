import { useEffect, useRef, useState } from "react";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { EndpointStatus, LastStatusChange } from "@/features/Devices/Network/components";
import { MappedEndpoint } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import { EndpointIdentity } from "./endpointShared";
import { useEndpointDisplay } from "./endpointLogic";
import { endpointListKey, portListKey } from "./overviewMerge";
import { useShowConnectionState } from "./connectionStateContext";
import EndpointDetailsPage from "./EndpointDetailsPage";
import EndpointServices from "./EndpointServices";
import AssignEndpointDialog from "./AssignEndpointDialog";
import { Button } from "@/components/ui/button";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";

const GuardedButton = withPermissionRequiredTooltip(Button);

interface props {
  endpoint: MappedEndpoint;
  deviceId: string;
  onCreated: () => void;
  highlighted?: boolean;
  onHighlightDone?: () => void;
}

const HIGHLIGHT_DURATION_MS = 4000;

export default function EndpointAccordionItem({ endpoint, deviceId, onCreated, highlighted = false, onHighlightDone }: props) {
  const display = useEndpointDisplay(endpoint);
  const showState = useShowConnectionState();
  const { needsAssignment, isConfigured } = display;
  const [assignEndpointOpen, setAssignEndpointOpen] = useState(false);
  const [hasExpanded, setHasExpanded] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const onHighlightDoneRef = useRef(onHighlightDone);
  useEffect(() => {
    onHighlightDoneRef.current = onHighlightDone;
  }, [onHighlightDone]);

  // Scroll to the row and flash it for a few seconds, once.
  useEffect(() => {
    if (!highlighted) return;
    rowRef.current?.scrollIntoView?.({ block: "center", behavior: "smooth" });
    const timer = setTimeout(() => onHighlightDoneRef.current?.(), HIGHLIGHT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [highlighted]);

  return (
    <AccordionItem value={endpointListKey(endpoint)} className="overflow-hidden rounded-lg border bg-background [&>[data-state=closed]]:hidden">
      <div
        ref={rowRef}
        data-highlighted={highlighted || undefined}
        className={`flex items-center pr-4 ${needsAssignment ? "bg-amber-50" : ""} ${highlighted ? "animate-search-highlight" : ""}`}
      >
        <div className="min-w-0 flex-1">
          <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/40" onClick={() => setHasExpanded(true)}>
            <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-3 pr-3">
              <div className="min-w-0 flex-1 basis-52">
                <EndpointIdentity display={display} typeLabel={endpoint.type_label ?? "Unidentified"} />
                {endpoint.ports.length > 0 && <div className="ml-12 mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-normal text-muted-foreground">
                  {endpoint.ports.slice(0, 4).map((port) => <span key={port.service_id ?? portListKey(port)}>
                    {port.type_label ?? "Unidentified"}{port.port != null ? ` :${port.port}` : ""}
                  </span>)}
                  {endpoint.ports.length > 4 && <span>+{endpoint.ports.length - 4} more</span>}
                </div>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {showState && <EndpointStatus value={endpoint.status} type="text" />}
                <span className="min-w-20 rounded bg-muted px-2 py-1 text-center text-xs font-normal text-muted-foreground">
                  {endpoint.ports.length} {endpoint.ports.length === 1 ? "service" : "services"}
                </span>
                {showState && endpoint.lastStatusChange && <LastStatusChange date={endpoint.lastStatusChange} variant="outline" />}
              </div>
            </div>
          </AccordionTrigger>
        </div>
        {!isConfigured && <div className="flex items-center gap-2 shrink-0 ml-2">
          <GuardedButton deviceId={deviceId} permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE}
            variant="outline" size="sm" onClick={() => setAssignEndpointOpen(true)}>
            Assign
          </GuardedButton>
        </div>}
      </div>
      {/* Fetch on first expansion, then retain drafts when the endpoint is collapsed. */}
      <AccordionContent forceMount={hasExpanded || undefined} className="border-t px-4 pt-1">
        {isConfigured && endpoint.endpoint_id ? (
          <EndpointDetailsPage endpointId={endpoint.endpoint_id} embedded networkEndpoint={endpoint}
            onBack={onCreated} onUpdated={onCreated} />
        ) : (
          <EndpointServices endpoint={endpoint} deviceId={deviceId} onUpdated={onCreated} />
        )}
      </AccordionContent>

      <AssignEndpointDialog
        open={assignEndpointOpen}
        onOpenChange={setAssignEndpointOpen}
        deviceId={deviceId}
        ip={endpoint.ip ?? undefined}
        defaultTypeId={endpoint.source === "default" ? endpoint.type_id : null}
        onCreated={onCreated}
      />
    </AccordionItem>
  );
}
