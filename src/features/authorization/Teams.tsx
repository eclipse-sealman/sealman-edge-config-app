import { useMemo, useState } from "react";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { PencilSquareIcon, TrashIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Table, TBody, TD, TH, THead, TR } from "@/components/Table/TableComponents";
import type { components } from "@/generated/edge-administration/types";
import { TeamDeleteDialog } from "./TeamDeleteDialog";
import { TeamEditDialog } from "./TeamEditDialog";
import { TeamMembersDialog } from "./TeamMembersDialog";

type TeamListItemResponse = components["schemas"]["TeamListItemResponse"];

const columnHelper = createColumnHelper<TeamListItemResponse>();

export default function Teams() {
  const { data: teams, isLoading, isError, error } = edgeConfigApiHooks.useGetTeams();
  const [deleteTeamTarget, setDeleteTeamTarget] = useState<TeamListItemResponse | null>(null);
  const [editTeamTarget, setEditTeamTarget] = useState<TeamListItemResponse | null>(null);
  const [membersTeamTarget, setMembersTeamTarget] = useState<TeamListItemResponse | null>(null);
  const [isCreateTeamDialogOpen, setIsCreateTeamDialogOpen] = useState(false);

  const handleEditTeam = (team: TeamListItemResponse) => {
    setEditTeamTarget(team);
  };

  const handleDeleteTeam = (team: TeamListItemResponse) => {
    setDeleteTeamTarget(team);
  };

  const handleCreateTeam = () => {
    setIsCreateTeamDialogOpen(true);
  };

  const handleMembers = (team: TeamListItemResponse) => {
    setMembersTeamTarget(team);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor("roles", {
        header: "Roles",
        cell: (info) => {
          const roles = info.getValue();

          if (roles.length === 0) {
            return <span className="text-muted-foreground">-</span>;
          }

          return (
            <div className="flex flex-wrap gap-1.5">
              {roles.map((role) => (
                <span
                  key={role.id}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {role.name}
                </span>
              ))}
            </div>
          );
        },
      }),
      columnHelper.accessor("scope", {
        header: "Scope",
        cell: (info) => {
          const scope = info.getValue();
          if (!scope) {
            return (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 italic">
                global
              </span>
            );
          }
          return <span className="text-muted-foreground">{scope.name}</span>;
        },
      }),
      columnHelper.accessor("user_count", {
        header: "Users",
        meta: { align: "right" },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        meta: { align: "center" },
        cell: (info) => {
          const team = info.row.original;

          return (
            <div className="flex items-center justify-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleEditTeam(team)}
                      className="
                        inline-flex items-center gap-1
                        px-3 py-1.5 rounded-md
                        bg-slate-100 text-slate-700
                        hover:bg-slate-200
                        transition-all
                        font-medium
                        shadow-xs
                      "
                      aria-label={`Edit team ${team.name}`}
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleMembers(team)}
                      className="
                        inline-flex items-center gap-1
                        px-3 py-1.5 rounded-md
                        bg-slate-100 text-slate-700
                        hover:bg-slate-200
                        transition-all
                        font-medium
                        shadow-xs
                      "
                      aria-label={`Manage members of ${team.name}`}
                    >
                      <UsersIcon className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Members</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleDeleteTeam(team)}
                      className="
                        inline-flex items-center gap-1
                        px-3 py-1.5 rounded-md
                        bg-red-50 text-red-700
                        hover:bg-red-100
                        transition-all
                        font-medium
                        shadow-xs
                      "
                      aria-label={`Delete team ${team.name}`}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        },
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: teams ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <div>Loading teams...</div>;
  }

  if (isError) {
    return <div>Failed to load teams: {error.message}</div>;
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Teams</h2>
        <Button type="button" onClick={handleCreateTeam}>
          New team
        </Button>
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
                    No teams found
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

      <TeamDeleteDialog
        teamId={deleteTeamTarget?.id ?? null}
        teamName={deleteTeamTarget?.name ?? ""}
        userCount={deleteTeamTarget?.user_count ?? 0}
        open={Boolean(deleteTeamTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTeamTarget(null);
          }
        }}
      />

      <TeamEditDialog
        team={editTeamTarget}
        open={Boolean(editTeamTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setEditTeamTarget(null);
          }
        }}
      />

      <TeamEditDialog
        team={null}
        open={isCreateTeamDialogOpen}
        onOpenChange={setIsCreateTeamDialogOpen}
      />

      <TeamMembersDialog
        team={membersTeamTarget}
        open={Boolean(membersTeamTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setMembersTeamTarget(null);
          }
        }}
      />
    </div>
  );
}
