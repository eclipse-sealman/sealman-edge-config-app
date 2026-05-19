import Badge, { BadgeColor } from "../../components/Typography/Badge";
import { useNavigate, useParams } from "react-router-dom";
import { DeviceCardsProps } from "./Devices.types";
import FilterDetails from "./FilterDetails";
import DebouncedInput from "@/components/Input/DebouncedInput";

export function DeviceCards({
  table,
  globalFilter,
  data,
  clearTableFilter,
}: DeviceCardsProps) {
  const navigate = useNavigate();
  const { deviceId } = useParams();

  const deviceItems = table.getRowModel().rows.map((row) => {
    const device = row.original;
    return (
      <div
        key={device.deviceId}
        className={`p-2 rounded-sm border border ${deviceId === device.deviceId ? "bg-gray-100" : "bg-white"}`}
      >
        <div className="flex flex-row items-center gap-4">
          <div onClick={() => navigate(`/devices/${device.deviceId}`)}>
            <div className="flex flex-row gap-1">
                <Badge color={device.deviceStatus === "Connected" ? BadgeColor.Green : BadgeColor.Red}>
                  {device.deviceStatus === "Connected" ? "online" : "offline"}
                </Badge>
              <Badge>{device.deviceMetadata.customer?.value as string}</Badge>
            </div>
            <div className="font-medium truncate">{device.deviceId}</div>
            <div className="truncate">
              {device.deviceMetadata.description?.value as string}
            </div>
          </div>
        </div>
      </div>
    );
  });

  return (
    <div className="space-y-2">
      <div className="sticky top-0 rounded-sm bg-vibrant-blue p-[9px] font-medium">
        <FilterDetails
          className="pb-2"
          totalRows={data.length}
          filteredRows={table.getRowModel().rows.length}
          clearTableFilter={clearTableFilter}
        />

        <DebouncedInput
          className="w-full"
          type="text"
          name="filter"
          value={globalFilter}
          onChange={(value) => table.setGlobalFilter(value as string)}
          placeholder="Search"
        />
      </div>
      {deviceItems}
    </div>
  );
}
