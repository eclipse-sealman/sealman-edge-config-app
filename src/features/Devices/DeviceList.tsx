import { useCallback, useEffect, useMemo, useState } from "react";
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
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  Updater,
  ColumnFiltersState,
  ColumnDef,
} from "@tanstack/react-table";
import Filter from "../../components/Table/Filter";
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

  // Fields configured as visible in Settings → Platform Types → Devices Table Columns.
  const visibleMetadataFields = useMemo(
    () => metadataFields.filter(([key]) => columnVisibilityOverrides[key] ?? defaultFieldVisible(key)),
    [metadataFields, columnVisibilityOverrides],
  );

  const columns = useMemo<ColumnDef<DeviceDataDisplay, any>[]>(() => {
    const metadataColumns = visibleMetadataFields.map(([key, field]) =>
      columnHelper.accessor((row) => formatMetadataValue(row.deviceMetadata[key]?.value, field), {
        id: `meta:${key}`,
        header: () => field.label,
      }),
    );
    return [...baseColumns, ...metadataColumns];
  }, [visibleMetadataFields]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      columnFilters,
      globalFilter,
    },
    initialState: {
      columnVisibility: {
        iotEdgeRuntime: false,
      },
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
    getFacetedRowModel: getFacetedRowModel(),
    globalFilterFn: "includesString",
    getColumnCanGlobalFilter: () => true,
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
  });

   useEffect(() => {
    table.resetColumnFilters();
    table.resetGlobalFilter();
0;  }, []);

  const clearTableFilter = useCallback(() => {
    table.resetColumnFilters();
    table.resetGlobalFilter();
    setGlobalFilter("");
  }, [table]);

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
          <div className="flex-0 flex flex-row">
            <DevicesHeader
              deviceOnlineFilter={deviceOnlineFilter}
              setDeviceOnlineFilter={filterByStatusFromHeader}
            />
            <div className="p-2">
              {data ? (
                <FilterDetails
                  totalRows={data.length}
                  filteredRows={table.getRowModel().rows.length}
                  clearTableFilter={clearTableFilter}
                />
              ) : (
                <></>
              )}
            </div>
          </div>
          <div className="flex-1 flex flex-row-reverse py-2 px-2 gap-4 items-center">
            <div className="flex-0 self-end">
              <DebouncedInput
                type="text"
                name="filter"
                value={globalFilter}
                onChange={(value) => table.setGlobalFilter(value as string)}
                placeholder="Search all"
                className="text-sm text-black -my-1 p-1 float-right"
              />
            </div>
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
          clearTableFilter={clearTableFilter}
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
                    <div>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </div>
                    {header.column.getCanFilter() ? (
                      <div className="py-1">
                        <Filter column={header.column} />
                      </div>
                    ) : (
                      <div className="min-h-8"></div>
                    )}
                  </TH>
                ))}
                <TH style={{ width: "60px" }}>
                  <div></div>
                  <div className="min-h-8"></div>
                </TH>
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
