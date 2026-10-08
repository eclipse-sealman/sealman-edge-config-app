import { Badge } from "@/components/ui/badge";
import type { DeviceEndpointsInfo } from "../Devices.types";

export default function EndpointCountBadge({ deviceId, endpoints }: { deviceId: string; endpoints: DeviceEndpointsInfo }) {
  if (endpoints.isLoading) return <Badge variant="outline">...</Badge>;
  if (endpoints.isError) return <Badge variant="outline">-</Badge>;

  const total = endpoints.byDevice.get(deviceId)?.length ?? 0;
  const matching = endpoints.hasEndpointFilters ? (endpoints.matching.get(deviceId)?.length ?? 0) : total;

  return (
    <Badge variant={total === 0 ? "outline" : "secondary"} title={`${total} endpoint${total === 1 ? "" : "s"}`}>
      {matching !== total ? `${matching} / ${total}` : total}
    </Badge>
  );
}
