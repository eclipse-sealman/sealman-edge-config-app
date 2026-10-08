import { Fragment, useMemo, useState } from "react";
import Badge, { BadgeColor } from "../../components/Typography/Badge";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getFilteredRowModel,
  getSortedRowModel,
  Updater,
  ColumnFiltersState,
  ColumnDef,
} from "@tanstack/react-table";
import { DeviceData } from "../../api/edgeConfig/edgeConfigApiHooks";
import DevicesHeader, { DeviceOnlineFilterStatus } from "./DevicesHeader";
import FilterDetails from "./FilterDetails";
import useDeviceStore from "./deviceStore";
import useGetDevicesWithEndpoints from "@/generated/edge-administration/hooks/useGetDevices/useGetDevicesWithEndpoints";
import useGetDeviceTypes from "@/generated/edge-administration/hooks/device_types/useGetDeviceTypes";
import useGetEndpointTypes from "@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes";
import useDeviceMetadataFields from "@/features/PlatformTypes/useDeviceMetadataFields";
import { formatMetadataValue } from "@/features/PlatformTypes/FieldValueInput";
import useDeviceTableColumnsStore, { defaultFieldVisible } from "@/features/PlatformTypes/deviceTableColumnsStore";
import { DeviceDataDisplay, DeviceEndpointsInfo, DeviceListProps } from "./Devices.types";
import { DeviceCards } from "./DeviceCards";
import DeviceManageDialog, { DeleteDeviceDialog } from "./DeviceManageDialog";
import DeviceSearchBar from "./search/DeviceSearchBar";
import DeviceEndpointsPanel from "./search/DeviceEndpointsPanel";
import EndpointCountBadge from "./search/EndpointCountBadge";
import { applySearch, buildSearchIndex, groupEndpointsByDevice } from "./search/deviceSearch";

function formatDataForTable(data: DeviceData[] | undefined): DeviceDataDisplay[] {
  if (!data) return [];

  return data.map((device) => ({
    ...device,
    onlineStatusEdge: device.iotEdgeRuntime === "Connected" ? "online" : "offline",
  }));
}

const columnHelper = createColumnHelper<DeviceDataDisplay>();

const getConnectionStatusColor = (connection: string) => {
  if (connection === "online") {
    return BadgeColor.Green;
  } else {
    return BadgeColor.Red;
  }
};

const baseColumns: ColumnDef<DeviceDataDisplay, any>[] = [
  columnHelper.accessor("onlineStatusEdge", {
    cell: (info) => (
      <Badge color={getConnectionStatusColor(info.getValue())}>
        {info.getValue()}
      </Badge>
    ),
    header: "Status",
    filterFn: "equalsString",
  }),
  columnHelper.accessor("iotEdgeRuntime", {
    cell: (info) => <Badge>{info.getValue()}</Badge>,
    header: "Edge Runtime",
    filterFn: "equalsString",
  }),
  columnHelper.accessor("deviceId", {
    header: () => "Device-ID",
    cell: (info) => (
      <Link
        to={`/devices/${encodeURIComponent(info.getValue())}`}
        onClick={(e) => e.stopPropagation()}
        className="font-medium hover:underline"
      >
        {info.getValue()}
      </Link>
    ),
  }),
];

export default function DeviceList() {
  const searchFilters = useDeviceStore.use.searchFilters();
  const setSearchFilters = useDeviceStore.use.setSearchFilters();

  const columnFilters = useDeviceStore.use.columnFilters();
  const setColumnFiltersStore = useDeviceStore.use.setColumnFilters();
  const setColumnFilters = (updaterOrValue: Updater<ColumnFiltersState>) => {
    setColumnFiltersStore(
      typeof updaterOrValue === "function"
        ? updaterOrValue(columnFilters)
        : updaterOrValue,
    );
  };

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpanded = (deviceId: string) =>
    setExpandedIds((current) => {
      const next = new Set(current);
      if (!next.delete(deviceId)) next.add(deviceId);
      return next;
    });

  const { isLoading, isError, data, error, isLoadingMore } = useGetDevicesWithEndpoints();
  const deviceTypesQuery = useGetDeviceTypes();
  const endpointTypesQuery = useGetEndpointTypes();
  const { fields: metadataFields } = useDeviceMetadataFields();
  const columnVisibilityOverrides = useDeviceTableColumnsStore((s) => s.overrides);

  const allDevices = useMemo<DeviceDataDisplay[]>(
    () => formatDataForTable(data as DeviceData[]),
    [data],
  );

  const endpointsByDevice = useMemo(
    () => groupEndpointsByDevice(data ?? []),
    [data],
  );

  // The API leaves `endpoints` out entirely when the user may not read endpoints.
  const endpointsUnavailable = !!data?.length && data.every((device) => device.endpoints === undefined);

  const deviceLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    for (const deviceType of deviceTypesQuery.data ?? []) {
      for (const [key, field] of Object.entries(deviceType.fields)) {
        labels[key] ??= field.label;
      }
    }
    return labels;
  }, [deviceTypesQuery.data]);

  const searchIndex = useMemo(
    () => buildSearchIndex(allDevices, endpointsByDevice, deviceLabels, endpointTypesQuery.data ?? []),
    [allDevices, endpointsByDevice, deviceLabels, endpointTypesQuery.data],
  );

  const { devices: tableData, matchingEndpoints } = useMemo(
    () => applySearch(allDevices, endpointsByDevice, searchFilters),
    [allDevices, endpointsByDevice, searchFilters],
  );

  const endpointsInfo = useMemo<DeviceEndpointsInfo>(
    () => ({
      isLoading: false,
      isError: endpointsUnavailable,
      errorMessage: endpointsUnavailable ? "you are not allowed to read endpoints" : undefined,
      byDevice: endpointsByDevice,
      matching: matchingEndpoints,
      hasEndpointFilters: searchFilters.some((filter) => filter.scope === "endpoint"),
    }),
    [endpointsUnavailable, endpointsByDevice, matchingEndpoints, searchFilters],
  );

  // Metadata columns are just the customizable display in the table - which fields show up
  // there is controlled by Settings → Platform Types → Devices Table Columns. Search itself
  // covers every metadata key a device has, see search/deviceSearch.ts.
  const columns = useMemo<ColumnDef<DeviceDataDisplay, any>[]>(() => {
    const metadataColumns = metadataFields.map(([key, field]) =>
      columnHelper.accessor((row) => formatMetadataValue(row.deviceMetadata[key]?.value, field), {
        id: `meta:${key}`,
        header: () => field.label,
      }),
    );
    return [...baseColumns, ...metadataColumns];
  }, [metadataFields]);

  const columnVisibility = useMemo(() => {
    const visibility: Record<string, boolean> = { iotEdgeRuntime: false };
    for (const [key] of metadataFields) {
      visibility[`meta:${key}`] = columnVisibilityOverrides[key] ?? defaultFieldVisible(key);
    }
    return visibility;
  }, [metadataFields, columnVisibilityOverrides]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      columnFilters,
      columnVisibility,
    },
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const calculateDeviceOnlineFilter = () => {
    if (columnFilters.length === 1 && columnFilters[0].id === "iotEdgeRuntime") {
      return columnFilters[0].value === "Connected"
        ? DeviceOnlineFilterStatus.Online
        : DeviceOnlineFilterStatus.Offline;
    } else {
      return DeviceOnlineFilterStatus.All;
    }
  };
  const deviceOnlineFilter = useMemo(calculateDeviceOnlineFilter, [
    columnFilters,
  ]);

  const filterByStatusFromHeader = (
    deviceOnlineFilterStatus: DeviceOnlineFilterStatus,
  ) => {
    if (deviceOnlineFilterStatus === DeviceOnlineFilterStatus.All) {
      setColumnFilters([]);
    } else {
      setColumnFilters([
        {
          id: "iotEdgeRuntime",
          value:
            deviceOnlineFilterStatus === DeviceOnlineFilterStatus.Online
              ? "Connected"
              : "Disconnected",
        },
      ]);
    }
  };

  if (isLoading) return <div>Loading</div>;

  if (isError)
    return <div>Error: {(error as { message: string }).message}</div>;

  const searchBar = (
    <DeviceSearchBar index={searchIndex} filters={searchFilters} onChange={setSearchFilters} />
  );

  return (
    <div className="@container w-full">
      <div className="hidden @2xl:block space-y-3 p-3">
        <div className="flex flex-row flex-wrap items-center gap-3">
          <div className="min-w-72 flex-1">{searchBar}</div>
          <DevicesHeader
            deviceOnlineFilter={deviceOnlineFilter}
            setDeviceOnlineFilter={filterByStatusFromHeader}
          />
          {data && (
            <FilterDetails
              totalRows={data.length}
              filteredRows={table.getRowModel().rows.length}
              className="items-center"
            />
          )}
          {isLoadingMore && <span className="text-xs text-muted-foreground">Loading more devices...</span>}
          <DeviceManageDialog />
        </div>
        <DeviceTable
          table={table}
          endpoints={endpointsInfo}
          expandedIds={expandedIds}
          onToggleExpanded={toggleExpanded}
        />
      </div>
      <div className="block @2xl:hidden">
        <DeviceCards
          table={table}
          data={allDevices}
          searchBar={searchBar}
          endpoints={endpointsInfo}
          expandedIds={expandedIds}
          onToggleExpanded={toggleExpanded}
        />
      </div>
    </div>
  );
}

function DeviceTable({ table, endpoints, expandedIds, onToggleExpanded }: DeviceListProps) {
  const navigate = useNavigate();
  const { deviceId: activeDeviceId } = useParams();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  return (
    <>
      <div className="rounded-lg border bg-background overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead className="w-8" />
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
                <TableHead>Endpoints</TableHead>
                <TableHead className="w-40" />
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const id = row.original.deviceId;
              const isExpanded = expandedIds.has(id);
              const cells = row.getVisibleCells();
              const total = endpoints.byDevice.get(id)?.length ?? 0;
              return (
                <Fragment key={row.id}>
                  <TableRow
                    aria-expanded={isExpanded}
                    className={cn("cursor-pointer", activeDeviceId === id && "bg-muted")}
                    onClick={() => onToggleExpanded(id)}
                  >
                    <TableCell className="w-8 text-muted-foreground">
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </TableCell>
                    {cells.map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                    <TableCell>
                      <EndpointCountBadge deviceId={id} endpoints={endpoints} />
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/devices/${encodeURIComponent(id)}`);
                          }}
                        >
                          Open
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          title="Delete device"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(id);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={cells.length + 3} className="px-4 py-3">
                        <DeviceEndpointsPanel
                          deviceId={id}
                          endpoints={
                            endpoints.hasEndpointFilters
                              ? (endpoints.matching.get(id) ?? [])
                              : (endpoints.byDevice.get(id) ?? [])
                          }
                          total={total}
                          isLoading={endpoints.isLoading}
                          isError={endpoints.isError}
                          errorMessage={endpoints.errorMessage}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {deleteTargetId && (
        <DeleteDeviceDialog
          deviceId={deleteTargetId}
          onClose={() => setDeleteTargetId(null)}
        />
      )}
    </>
  );
}
