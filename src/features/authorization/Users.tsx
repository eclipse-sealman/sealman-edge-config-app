import { useMemo, useState } from "react";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { EyeIcon, MagnifyingGlassIcon, UserGroupIcon } from "@heroicons/react/24/outline";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TBody, TD, TH, THead, TR } from "@/components/Table/TableComponents";
import type { components } from "@/generated/edge-administration/types";
import { usePermissions } from "./permissions/use-permissions";
import { PERMISSION_KEYS } from "./permissions/permission-keys";
import { UserTeamsDialog } from "./UserTeamsDialog";
import { UserDetailsDialog } from "./UserDetailsDialog";

type UserWithTeamsResponse = components["schemas"]["UserWithTeamsResponse"];

const columnHelper = createColumnHelper<UserWithTeamsResponse>();

export default function Users() {
  const { data: users, isLoading, isError, error } = edgeConfigApiHooks.useGetUsers();
  const { hasPermission: canWrite } = usePermissions({ permissionKey: PERMISSION_KEYS.PLATFORM_AUTHORIZATION_WRITE });
  const [manageTeamsTarget, setManageTeamsTarget] = useState<UserWithTeamsResponse | null>(null);
  const [detailsTarget, setDetailsTarget] = useState<UserWithTeamsResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterNewOnly, setFilterNewOnly] = useState(false);

  const handleManageTeams = (user: UserWithTeamsResponse) => {
    setManageTeamsTarget(user);
  };

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    return users.filter((user) => {
      const matchesSearch = 
        user.preferred_username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = !filterNewOnly || user.is_new;
      
      return matchesSearch && matchesFilter;
    });
  }, [users, searchQuery, filterNewOnly]);

  const columns = useMemo(
    () => [
      columnHelper.accessor("preferred_username", {
        header: "Preferred Username",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor("is_admin", {
        header: "Is Admin",
        cell: (info) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              info.getValue()
                ? "bg-green-100 text-green-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {info.getValue() ? "Yes" : "No"}
          </span>
        ),
      }),
      columnHelper.accessor("is_new", {
        header: "Is New",
        cell: (info) => (
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              info.getValue()
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-100 text-slate-700"
            }`}
          >
            {info.getValue() ? "Yes" : "No"}
          </span>
        ),
      }),
      columnHelper.accessor("teams", {
        header: "Teams",
        cell: (info) => {
          const teams = info.getValue();

          if (teams.length === 0) {
            return <span className="text-muted-foreground">-</span>;
          }

          return (
            <div className="flex flex-wrap gap-1.5">
              {teams.map((team) => (
                <span
                  key={team.id}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {team.name}
                </span>
              ))}
            </div>
          );
        },
      }),
      columnHelper.accessor("last_active", {
        header: "Last Active",
        cell: (info) => {
          const value = info.getValue();
          if (!value) {
            return <span className="text-muted-foreground">-</span>;
          }
          return <span>{new Date(value).toLocaleString()}</span>;
        },
      }),
      ...(canWrite ? [columnHelper.display({
        id: "actions",
        header: "",
        meta: { align: "center" },
        cell: (info) => {
          const user = info.row.original;

          return (
            <div className="flex items-center justify-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setDetailsTarget(user)}
                      className="
                        inline-flex items-center gap-1
                        px-3 py-1.5 rounded-md
                        bg-slate-100 text-slate-700
                        hover:bg-slate-200
                        transition-all
                        font-medium
                        shadow-xs
                      "
                      aria-label={`View details for ${user.preferred_username}`}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>View Details</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleManageTeams(user)}
                      className="
                        inline-flex items-center gap-1
                        px-3 py-1.5 rounded-md
                        bg-slate-100 text-slate-700
                        hover:bg-slate-200
                        transition-all
                        font-medium
                        shadow-xs
                      "
                      aria-label={`Manage teams for ${user.preferred_username}`}
                    >
                      <UserGroupIcon className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Manage Teams</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        },
      })] : []),
    ],
    [canWrite],
  );

  const table = useReactTable({
    data: filteredUsers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  if (isError) {
    return <div>Failed to load users: {error.message}</div>;
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Users</h2>
      </div>

      <div className="bg-card border rounded-lg p-4 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="filter-new-users"
              checked={filterNewOnly}
              onCheckedChange={setFilterNewOnly}
            />
            <Label htmlFor="filter-new-users" className="cursor-pointer">
              New users only
            </Label>
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4 flex-1 min-h-0 flex flex-col">
        <div className="h-full min-h-0 overflow-y-auto border rounded-md">
          <Table className="w-full text-sm border-collapse">
            <THead className="bg-background sticky top-0 z-20 shadow-xs">
              {table.getHeaderGroups().map((headerGroup) => (
                <TR
                  key={headerGroup.id}
                  className="bg-linear-to-r from-slate-100 to-slate-50 border-b even:bg-transparent"
                >
                  {headerGroup.headers.map((header) => (
                    <TH
                      key={header.id}
                      className={`px-4 py-3 font-semibold text-muted-foreground tracking-wide ${
                        header.column.columnDef.meta?.align === "right"
                          ? "text-right"
                          : header.column.columnDef.meta?.align === "center"
                            ? "text-center"
                            : "text-left"
                      } ${header.column.columnDef.meta?.align === "center" ? "w-28" : ""}`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TH>
                  ))}
                </TR>
              ))}
            </THead>

            <TBody className="bg-background">
              {table.getRowModel().rows.length === 0 ? (
                <TR>
                  <TD
                    colSpan={columns.length}
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                  >
                    No users found
                  </TD>
                </TR>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TR key={row.id} className="border-b last:border-b-0 even:bg-transparent">
                    {row.getVisibleCells().map((cell) => (
                      <TD
                        key={cell.id}
                        className={`p-3 ${
                          cell.column.columnDef.meta?.align === "right"
                            ? "text-right"
                            : cell.column.columnDef.meta?.align === "center"
                              ? "text-center"
                              : ""
                        } ${cell.column.columnDef.meta?.align === "center" ? "px-3 py-2" : ""}`}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TD>
                    ))}
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </div>
      </div>

      <UserTeamsDialog
        user={manageTeamsTarget}
        open={Boolean(manageTeamsTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setManageTeamsTarget(null);
          }
        }}
      />

      <UserDetailsDialog
        user={detailsTarget}
        open={Boolean(detailsTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDetailsTarget(null);
          }
        }}
      />
    </div>
  );
}
