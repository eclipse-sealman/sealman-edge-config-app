import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { EndpointData } from "./deviceSearch";
import { endpointDetailFields } from "./deviceSearch";

interface DeviceEndpointsPanelProps {
  deviceId: string;
  endpoints: EndpointData[];
  total: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
}

export default function DeviceEndpointsPanel({ deviceId, endpoints, total, isLoading, isError, errorMessage }: DeviceEndpointsPanelProps) {
  const isFiltered = endpoints.length !== total;

  return (
    <div className="space-y-2 py-1">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">
          Endpoints
          <span className="ml-2 font-normal text-muted-foreground">
            {isFiltered ? `${endpoints.length} of ${total} match the filter` : total}
          </span>
        </p>
        <Button asChild variant="outline" size="sm">
          <Link to={`/devices/${encodeURIComponent(deviceId)}/network`}>Open endpoints</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading endpoints...</p>
      ) : isError ? (
        <p className="text-sm text-destructive">Failed to load endpoints{errorMessage ? `: ${errorMessage}` : "."}</p>
      ) : endpoints.length === 0 ? (
        <p className="text-sm text-muted-foreground">No endpoints configured for this device.</p>
      ) : (
        <ul className="divide-y rounded-md border bg-background">
          {endpoints.map((endpoint) => {
            const name = endpoint.endpoint_data.name?.value as string | undefined;
            const ip = endpoint.endpoint_data.ip?.value as string | undefined;
            const details = endpointDetailFields(endpoint);
            return (
              <li key={endpoint.endpoint_id} className="space-y-1 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-medium">{name ?? endpoint.type_label}</span>
                  <Badge variant="secondary">{endpoint.type_label}</Badge>
                  {ip && <span className="font-mono text-xs text-muted-foreground">{ip}</span>}
                </div>
                {details.length > 0 && (
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                    {details.map((field) => (
                      <span key={field.key}>
                        {field.label}: <span className="text-foreground">{field.value}</span>
                      </span>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
