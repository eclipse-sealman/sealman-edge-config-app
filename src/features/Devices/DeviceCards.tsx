import Badge, { BadgeColor } from "../../components/Typography/Badge";
import { Link, useParams } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { DeviceCardsProps } from "./Devices.types";
import FilterDetails from "./FilterDetails";
import DeviceEndpointsPanel from "./search/DeviceEndpointsPanel";
import EndpointCountBadge from "./search/EndpointCountBadge";

export function DeviceCards({
  table,
  data,
  searchBar,
  endpoints,
  expandedIds,
  onToggleExpanded,
}: DeviceCardsProps) {
  const { deviceId } = useParams();

  const deviceItems = table.getRowModel().rows.map((row) => {
    const device = row.original;
    const isExpanded = expandedIds.has(device.deviceId);
    return (
      <div
        key={device.deviceId}
        className={`rounded-sm border ${deviceId === device.deviceId ? "bg-gray-100" : "bg-white"}`}
      >
        <div
          className="flex cursor-pointer flex-row items-center gap-2 p-2"
          aria-expanded={isExpanded}
          onClick={() => onToggleExpanded(device.deviceId)}
        >
          {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
          <div className="min-w-0 flex-1">
            <div className="flex flex-row flex-wrap gap-1">
              <Badge color={device.deviceStatus === "Connected" ? BadgeColor.Green : BadgeColor.Red}>
                {device.deviceStatus === "Connected" ? "online" : "offline"}
              </Badge>
              <Badge>{device.deviceMetadata.customer?.value as string}</Badge>
            </div>
            <Link
              to={`/devices/${encodeURIComponent(device.deviceId)}`}
              onClick={(e) => e.stopPropagation()}
              className="block truncate font-medium hover:underline"
            >
              {device.deviceId}
            </Link>
            <div className="truncate">
              {device.deviceMetadata.description?.value as string}
            </div>
          </div>
          <EndpointCountBadge deviceId={device.deviceId} endpoints={endpoints} />
        </div>
        {isExpanded && (
          <div className="border-t bg-muted/30 px-2 py-2">
            <DeviceEndpointsPanel
              deviceId={device.deviceId}
              endpoints={
                endpoints.hasEndpointFilters
                  ? (endpoints.matching.get(device.deviceId) ?? [])
                  : (endpoints.byDevice.get(device.deviceId) ?? [])
              }
              total={endpoints.byDevice.get(device.deviceId)?.length ?? 0}
              isLoading={endpoints.isLoading}
              isError={endpoints.isError}
              errorMessage={endpoints.errorMessage}
            />
          </div>
        )}
      </div>
    );
  });

  return (
    <div className="space-y-2">
      <div className="sticky top-0 z-10 space-y-2 rounded-sm bg-vibrant-blue p-[9px] font-medium">
        <FilterDetails
          totalRows={data.length}
          filteredRows={table.getRowModel().rows.length}
        />
        {searchBar}
      </div>
      {deviceItems}
    </div>
  );
}
