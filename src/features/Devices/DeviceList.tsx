import { useEffect, useMemo, useState } from "react";
import Badge, { BadgeColor } from "../../components/Typography/Badge";
import { useNavigate, useParams } from "react-router-dom";
import {
  Table,
  TBody,
  THead,
  TH,
  TD,
  TR,
} from "../../components/Table/TableComponents";
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
import DebouncedInput from "../../components/Input/DebouncedInput";
import FilterDetails from "./FilterDetails";
import useDeviceStore from "./deviceStore";
import useGetDevices from "@/generated/edge-administration/hooks/useGetDevices/useGetDevices";
import useDeviceMetadataFields from "@/features/PlatformTypes/useDeviceMetadataFields";
import { formatMetadataValue } from "@/features/PlatformTypes/FieldValueInput";
import useDeviceTableColumnsStore, { defaultFieldVisible } from "@/features/PlatformTypes/deviceTableColumnsStore";
import { DeviceDataDisplay, DeviceListProps } from "./Devices.types";
import { DeviceCards } from "./DeviceCards";
import DeviceManageDialog, { DeleteDeviceDialog } from "./DeviceManageDialog";

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
  }),
];

export default function DeviceList() {
  const globalFilter = useDeviceStore.use.globalFilter();
  const setGlobalFilter = useDeviceStore.use.setGlobalFilter();

  const columnFilters = useDeviceStore.use.columnFilters();
  const setColumnFiltersStore = useDeviceStore.use.setColumnFilters();
  const setColumnFilters = (updaterOrValue: Updater<ColumnFiltersState>) => {
    setColumnFiltersStore(
      typeof updaterOrValue === "function"
        ? updaterOrValue(columnFilters)
        : updaterOrValue,
    );
  };

  useEffect(() => {
    setGlobalFilter("");
    setColumnFiltersStore([]);
  }, []);

  const { isLoading, isError, data, error } = useGetDevices();
  const { fields: metadataFields } = useDeviceMetadataFields();
  const columnVisibilityOverrides = useDeviceTableColumnsStore((s) => s.overrides);

  const tableData = useMemo<DeviceDataDisplay[]>(
    () => formatDataForTable(data as DeviceData[]),
    [data],
  );

  // Metadata columns are just the customizable display in the table - which fields show up
  // there is controlled by Settings → Platform Types → Devices Table Columns. Search itself is
  // scoped separately, below, to every metadata key a device has (see metadataSearchIndexColumn).
  const columns = useMemo<ColumnDef<DeviceDataDisplay, any>[]>(() => {
    const metadataColumns = metadataFields.map(([key, field]) =>
      columnHelper.accessor((row) => formatMetadataValue(row.deviceMetadata[key]?.value, field), {
        id: `meta:${key}`,
        header: () => field.label,
      }),
    );
    // Hidden column whose value is every metadata value a device has, joined into one search
    // blob - not just the fields configured as table columns above - so the search bar reaches
    // fields that aren't shown (or aren't even part of the default type's required fields).
    const metadataSearchIndexColumn = columnHelper.accessor(
      (row) =>
        Object.values(row.deviceMetadata ?? {})
          .map((entry) => entry?.value)
          .filter((value) => value !== null && value !== undefined && value !== "")
          .map(String)
          .join(" "),
      { id: "metadataSearchIndex", header: () => null },
    );
    return [...baseColumns, ...metadataColumns, metadataSearchIndexColumn];
  }, [metadataFields]);

  const columnVisibility = useMemo(() => {
    const visibility: Record<string, boolean> = { iotEdgeRuntime: false, metadataSearchIndex: false };
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
      globalFilter,
      columnVisibility,
    },
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
    // Search device IDs plus the full metadata index (every key a device has, regardless of
    // whether it's shown as a column) - not the per-field meta:* columns or Status/Edge Runtime.
    getColumnCanGlobalFilter: (column) => column.id === "deviceId" || column.id === "metadataSearchIndex",
  });

   useEffect(() => {
    table.resetColumnFilters();
    table.resetGlobalFilter();
0;  }, []);

  const calculateDeviceOnlineFilter = () => {
    if (columnFilters.length === 1 && columnFilters[0].id === "onlineStatus") {
      return columnFilters[0].value === "online"
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
    setGlobalFilter("");
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

  return (
    <div className="@container w-full">
      <div className="hidden @2xl:block">
        <div className="sticky top-0 h-10 z-10 bg-slate-200 flex flex-row b">
          <div className="flex-0 flex flex-row items-center py-2 px-2">
            <DebouncedInput
              type="text"
              name="filter"
              value={globalFilter}
              onChange={(value) => table.setGlobalFilter(value as string)}
              placeholder="Search device ID or metadata"
              className="text-sm text-black -my-1 p-1 w-72"
            />
          </div>
          <div className="flex-0 flex flex-row items-center gap-2">
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
          </div>
          <div className="flex-1 flex flex-row justify-end py-2 px-2 gap-4 items-center">
            <div className="flex-0 self-center">
              <DeviceManageDialog />
            </div>
          </div>
        </div>
        <DeviceTable table={table} />
      </div>
      <div className="block @2xl:hidden">
        <DeviceCards
          table={table}
          globalFilter={globalFilter}
          data={tableData}
        />
      </div>
    </div>
  );
}

function DeviceTable({ table }: DeviceListProps) {
  const navigate = useNavigate();
  const { deviceId: activeDeviceId } = useParams();
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  return (
    <>
      <div className="rounded-sm">
        <Table>
          <THead className="top-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TR key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TH key={header.id} style={{ width: `${header.getSize()}px` }}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TH>
                ))}
                <TH style={{ width: "60px" }} />
              </TR>
            ))}
          </THead>
          <TBody>
            {table.getRowModel().rows.map((row) => (
              <TR
                key={row.id}
                className={`group ${activeDeviceId === row.original.deviceId ? "" : "hover:bg-gray-100"}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <TD
                    key={cell.id}
                    onClick={() => navigate(`/devices/${row.original.deviceId}`)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TD>
                ))}
                <TD>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTargetId(row.original.deviceId);
                    }}
                    className="text-xs px-2 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50"
                    title="Delete device"
                  >
                    Delete
                  </button>
                </TD>
              </TR>
            ))}
          </TBody>
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
