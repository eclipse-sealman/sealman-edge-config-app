import type { ReactNode } from "react";
import { Accordion } from "@/components/ui/accordion";
import EndpointAccordionItem from "./EndpointAccordionItem";
import EndpointActions from "./EndpointActions";
import { MappedEndpoint } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import { endpointListKey } from "./overviewMerge";

interface props {
  endpoints: MappedEndpoint[];
  deviceId: string;
  onScan: () => void;
  isScanning: boolean;
  scanDisabled?: boolean;
  scanAvailable?: boolean;
  onAddEndpoint: () => void;
  onEndpointCreated: () => void;
  viewToggle?: ReactNode;
  // The endpoint to scroll to and flash (e.g. when arriving from the device search).
  highlightedEndpointId?: string | null;
  onHighlightDone?: () => void;
}

export default function DiscoveredEndpointsCard({
  endpoints,
  deviceId,
  onScan,
  isScanning,
  scanDisabled,
  scanAvailable,
  onAddEndpoint,
  onEndpointCreated,
  viewToggle,
  highlightedEndpointId,
  onHighlightDone,
}: props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-700">Endpoints</h2>
          <p className="text-sm text-muted-foreground">
            Physical machines and systems discovered on the network. Expand each endpoint to view its services.
          </p>
        </div>
        <EndpointActions deviceId={deviceId} onScan={onScan} isScanning={isScanning} scanDisabled={scanDisabled} scanAvailable={scanAvailable} onAddEndpoint={onAddEndpoint} leading={viewToggle} />
      </div>

      <div>
        {endpoints.length === 0 ? (
          <p className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">No endpoints yet. Add an endpoint or scan the network to get started.</p>
        ) : (
          <Accordion type="multiple" className="w-full space-y-3">
            {endpoints.map((endpoint) => (
              <EndpointAccordionItem
                key={endpointListKey(endpoint)}
                endpoint={endpoint}
                deviceId={deviceId}
                onCreated={onEndpointCreated}
                highlighted={endpoint.endpoint_id != null && endpoint.endpoint_id === highlightedEndpointId}
                onHighlightDone={onHighlightDone}
              />
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
}
