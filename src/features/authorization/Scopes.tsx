import { useMemo, useState } from "react";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
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
import { ScopeDeleteDialog } from "./ScopeDeleteDialog";
import { ScopeEditDialog } from "./ScopeEditDialog";

type ScopeResponse = components["schemas"]["ScopeResponse"];

const columnHelper = createColumnHelper<ScopeResponse>();

function formatAttrValue(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item === null) {
          return "null";
        }

        if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
          return String(item);
        }

        return JSON.stringify(item);
      })
      .join(", ");
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value);
}

export default function Scopes() {
  const { data: scopes, isLoading, isError, error } = edgeConfigApiHooks.useGetScopes();
  const [deleteScopeTarget, setDeleteScopeTarget] = useState<ScopeResponse | null>(null);
  const [editScopeTarget, setEditScopeTarget] = useState<ScopeResponse | null>(null);
  const [isCreateScopeDialogOpen, setIsCreateScopeDialogOpen] = useState(false);

  const handleEditScope = (scope: ScopeResponse) => {
    setEditScopeTarget(scope);
  };

  const handleDeleteScope = (scope: ScopeResponse) => {
    setDeleteScopeTarget(scope);
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => (
          <span className="text-muted-foreground">{info.getValue() || "-"}</span>
        ),
      }),
      columnHelper.accessor("attr", {
        id: "attr",
        header: "Attributes",
        cell: (info) => {
          const attr = info.getValue();

          if (Object.keys(attr).length === 0) {
            return <span className="text-muted-foreground">-</span>;
          }

          return (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(attr).map(([key, value]) => (
                <span
                  key={key}
                  className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {key}: {formatAttrValue(value)}
                </span>
              ))}
            </div>
          );
        },
      }),
      columnHelper.accessor("access_rule", {
        header: "Access Rule",
      }),
      columnHelper.accessor("team_usage_count", {
        header: "Used by",
        meta: { align: "right" },
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        meta: { align: "center" },
        cell: (info) => {
          const scope = info.row.original;

          return (
            <div className="flex items-center justify-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleEditScope(scope)}
                      className="
                        inline-flex items-center gap-1
                        px-3 py-1.5 rounded-md
                        bg-slate-100 text-slate-700
                        hover:bg-slate-200
                        transition-all
                        font-medium
                        shadow-xs
                      "
                      aria-label={`Edit scope ${scope.name}`}
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
                      onClick={() => handleDeleteScope(scope)}
                      className="
                        inline-flex items-center gap-1
                        px-3 py-1.5 rounded-md
                        bg-red-50 text-red-700
                        hover:bg-red-100
                        transition-all
                        font-medium
                        shadow-xs
                      "
                      aria-label={`Delete scope ${scope.name}`}
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
    data: scopes ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <div>Loading scopes...</div>;
  }

  if (isError) {
    return <div>Failed to load scopes: {error.message}</div>;
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Scopes</h2>
        <Button type="button" onClick={() => setIsCreateScopeDialogOpen(true)}>
          New scope
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
                    No scopes found
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
                        } ${cell.column.columnDef.meta?.align === "center" ? "px-3 py-2" : ""} ${
                          cell.column.id === "attr" ? "align-top" : ""
                        }`}
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

      <ScopeDeleteDialog
        scopeId={deleteScopeTarget?.id ?? null}
        scopeName={deleteScopeTarget?.name ?? ""}
        teamUsageCount={deleteScopeTarget?.team_usage_count ?? 0}
        open={Boolean(deleteScopeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteScopeTarget(null);
          }
        }}
      />

      <ScopeEditDialog
        scope={editScopeTarget}
        open={Boolean(editScopeTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setEditScopeTarget(null);
          }
        }}
      />

      <ScopeEditDialog
        scope={null}
        open={isCreateScopeDialogOpen}
        onOpenChange={setIsCreateScopeDialogOpen}
      />
    </div>
  );
}