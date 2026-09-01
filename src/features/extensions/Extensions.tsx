import { useMemo, useState, Fragment } from "react";
import { ChevronDownIcon, ChevronRightIcon, KeyIcon, TrashIcon } from "@heroicons/react/24/outline";
import { edgeConfigApiHooks } from "@/api/edgeConfig/edgeConfigApiHooks";
import type { ExtensionRoute, ExtensionSummary } from "@/api/edgeConfig/edgeConfigApiHooks";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { usePermissions } from "@/features/authorization/permissions/use-permissions";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import { NoPermissionsPanel } from "@/features/authorization/permissions/NoPermissionsPanel";

const columnHelper = createColumnHelper<ExtensionSummary>();

function UpstreamBadges({ upstreams }: { upstreams: ExtensionSummary["upstreams"] }) {
  const entries = Object.entries(upstreams ?? {});
  if (entries.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([key, upstream]) => (
        <Badge key={key} variant="secondary" title={upstream.base_url ?? upstream.module_name ?? ""}>
          {key} ({upstream.type})
        </Badge>
      ))}
    </div>
  );
}

// 'internal' routes are only reachable via the extension's namespace-locked
// X-Internal-Key, 'device' routes via a per-device X-Device-Key - called out
// distinctly here so it's obvious at a glance which auth mechanism guards a
// given route (vs. 'public', which goes through the normal JWT+RBAC/ABAC path).
const VISIBILITY_STYLES: Record<ExtensionRoute["visibility"], string> = {
  public: "bg-slate-100 text-slate-700",
  internal: "bg-purple-100 text-purple-700",
  device: "bg-amber-100 text-amber-700",
};

const VISIBILITY_LABELS: Record<ExtensionRoute["visibility"], string> = {
  public: "Public",
  internal: "Internal (X-Internal-Key)",
  device: "Device (X-Device-Key)",
};

function RouteRow({ route }: { route: ExtensionRoute }) {
  return (
    <TableRow>
      <TableCell>
        <Badge variant="secondary">{route.method}</Badge>
      </TableCell>
      <TableCell className="font-mono text-sm">{route.path}</TableCell>
      <TableCell>
        <Badge variant="outline" className={`${VISIBILITY_STYLES[route.visibility]} border-transparent`}>
          {VISIBILITY_LABELS[route.visibility]}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{route.required_action || "-"}</TableCell>
      <TableCell className="text-muted-foreground">{route.summary || "-"}</TableCell>
    </TableRow>
  );
}

// Lets an operator issue/revoke the per-device keys ('device' visibility
// routes are authorized via X-Device-Key, resolved server-side to a device
// id). Only rendered when the extension actually has at least one 'device'
// route. The raw key is only ever returned once, right after issuance - it
// is never persisted/displayed again afterwards (only its hash is stored).
function DeviceKeysPanel({ name }: { name: string }) {
  const { data: keys, isLoading, isError, error } = edgeConfigApiHooks.useListDeviceKeys(name);
  const issueKey = edgeConfigApiHooks.useIssueDeviceKey(name);
  const revokeKey = edgeConfigApiHooks.useRevokeDeviceKey(name);
  const [deviceId, setDeviceId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [issuedKey, setIssuedKey] = useState<{ device_id: string; device_key: string } | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null);

  const handleIssue = async () => {
    if (!deviceId.trim()) {
      return;
    }
    const result = await issueKey.mutateAsync({ deviceId: deviceId.trim(), moduleId: moduleId.trim() || undefined });
    setIssuedKey(result);
    setDeviceId("");
    setModuleId("");
  };

  const handleRevoke = async () => {
    if (!revokeTarget) {
      return;
    }
    await revokeKey.mutateAsync(revokeTarget);
    setRevokeTarget(null);
  };

  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 mb-2">Device Keys</h4>

      {isLoading && <div className="text-sm text-muted-foreground mb-2">Loading device keys...</div>}
      {isError && <div className="text-sm text-red-600 mb-2">Failed to load device keys: {error.message}</div>}

      {keys && keys.length > 0 && (
        <div className="space-y-1 mb-3">
          {keys.map((key) => (
            <div key={key.device_id} className="text-sm flex items-center gap-2">
              <span className="font-mono">{key.device_id}</span>
              {key.module_id && <span className="text-muted-foreground">({key.module_id})</span>}
              <span className="text-muted-foreground text-xs">{key.created_at ?? ""}</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-600 hover:text-red-700"
                      onClick={() => setRevokeTarget(key.device_id)}
                      aria-label={`Revoke device key for ${key.device_id}`}
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Revoke</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      )}

      {keys && keys.length === 0 && (
        <div className="text-sm text-muted-foreground mb-3">No device keys issued yet.</div>
      )}

      <div className="flex items-end gap-2">
        <div className="grid gap-1">
          <Label htmlFor={`device-key-device-id-${name}`} className="text-xs">Device ID</Label>
          <Input
            id={`device-key-device-id-${name}`}
            className="h-8 w-40"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="e.g. 123456-thomas"
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor={`device-key-module-id-${name}`} className="text-xs">
            Module ID <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id={`device-key-module-id-${name}`}
            className="h-8 w-32"
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
          />
        </div>
        <Button type="button" size="sm" className="h-8" disabled={!deviceId.trim() || issueKey.isPending} onClick={handleIssue}>
          <KeyIcon className="w-3.5 h-3.5 mr-1" />
          {issueKey.isPending ? "Issuing..." : "Issue key"}
        </Button>
      </div>

      {issueKey.isError && (
        <div className="text-sm text-red-600 mt-2">Failed to issue key: {issueKey.error.message}</div>
      )}

      {issuedKey && (
        <div className="mt-2 text-sm bg-amber-50 border border-amber-200 rounded px-3 py-2">
          <div className="font-medium text-amber-800">
            Device key for <span className="font-mono">{issuedKey.device_id}</span> - copy it now, it won't be shown again:
          </div>
          <div className="flex items-center gap-2 mt-1">
            <code className="font-mono text-xs bg-white border rounded px-2 py-1 break-all">{issuedKey.device_key}</code>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => navigator.clipboard.writeText(issuedKey.device_key)}
            >
              Copy
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => setIssuedKey(null)}>
              Dismiss
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={revokeTarget !== null} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke device key?</AlertDialogTitle>
            <AlertDialogDescription>
              The device <strong>{revokeTarget}</strong> will no longer be able to authenticate against this
              extension's device-ingress routes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevoke}
              disabled={revokeKey.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokeKey.isPending ? "Revoking..." : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ExtensionDetailsPanel({ name }: { name: string }) {
  const { data, isLoading, isError, error } = edgeConfigApiHooks.useGetExtensionDetails(name);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground px-4 py-3">Loading details...</div>;
  }

  if (isError) {
    return (
      <div className="text-sm text-red-600 px-4 py-3">Failed to load extension details: {error.message}</div>
    );
  }

  if (!data) {
    return null;
  }

  const hasDeviceRoutes = data.routes.some((route) => route.visibility === "device");

  return (
    <div className="px-4 py-4 bg-slate-50 space-y-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Upstreams</h4>
        <div className="space-y-1">
          {Object.entries(data.upstreams).map(([key, upstream]) => (
            <div key={key} className="text-sm flex items-center gap-2">
              <Badge variant="secondary">{upstream.type}</Badge>
              <span className="font-medium">{key}</span>
              <span className="text-muted-foreground font-mono">
                {upstream.base_url ?? upstream.module_name ?? ""}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-2">
          Routes {data.routes.length > 0 && `(${data.routes.length})`}
        </h4>
        {data.routes.length === 0 ? (
          <span className="text-sm text-muted-foreground">No routes registered.</span>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Method</TableHead>
                <TableHead>Path</TableHead>
                <TableHead>Visibility</TableHead>
                <TableHead>Required Action</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.routes.map((route) => (
                <RouteRow key={route.id} route={route} />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {hasDeviceRoutes && <DeviceKeysPanel name={name} />}
    </div>
  );
}

export default function Extensions() {
  const { data: extensions, isLoading, isError, error } = edgeConfigApiHooks.useGetExtensions();
  const { hasPermission, noPermissionsMessage, isLoading: isPermissionLoading } = usePermissions({
    permissionKey: PERMISSION_KEYS.EXTENSION_REGISTER,
  });
  const { hasPermission: canDeregister } = usePermissions({
    permissionKey: PERMISSION_KEYS.EXTENSION_DEREGISTER,
  });
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set());
  const [deregisterTarget, setDeregisterTarget] = useState<string | null>(null);
  const deregisterExtension = edgeConfigApiHooks.useDeregisterExtension();

  const toggleExpanded = (name: string) => {
    setExpandedNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const handleDeregister = async () => {
    if (!deregisterTarget) {
      return;
    }
    await deregisterExtension.mutateAsync(deregisterTarget);
    setDeregisterTarget(null);
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "expand",
        header: "",
        meta: { align: "center" },
        cell: (info) => {
          const name = info.row.original.name;
          const isExpanded = expandedNames.has(name);
          return (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => toggleExpanded(name)}
              aria-label={isExpanded ? `Collapse ${name}` : `Expand ${name}`}
            >
              {isExpanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
            </Button>
          );
        },
      }),
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => <span className="font-medium">{info.getValue()}</span>,
      }),
      columnHelper.accessor("description", {
        header: "Description",
        cell: (info) => <span className="text-muted-foreground">{info.getValue() || "-"}</span>,
      }),
      columnHelper.accessor("upstreams", {
        header: "Upstreams",
        cell: (info) => <UpstreamBadges upstreams={info.getValue()} />,
      }),
      columnHelper.accessor("created_at", {
        header: "Registered",
        cell: (info) => <span className="text-muted-foreground">{info.getValue() || "-"}</span>,
      }),
      ...(canDeregister
        ? [
            columnHelper.display({
              id: "row-actions",
              header: "",
              meta: { align: "center" },
              cell: (info) => (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeregisterTarget(info.row.original.name);
                        }}
                        aria-label={`Deregister ${info.row.original.name}`}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Deregister</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ),
            }),
          ]
        : []),
    ],
    [expandedNames, canDeregister],
  );

  const table = useReactTable({
    data: extensions ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isPermissionLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vibrant-blue"></div>
      </div>
    );
  }

  if (!hasPermission) {
    return <NoPermissionsPanel>{noPermissionsMessage}</NoPermissionsPanel>;
  }

  if (isLoading) {
    return <div className="p-6">Loading extensions...</div>;
  }

  if (isError) {
    return <div className="p-6">Failed to load extensions: {error.message}</div>;
  }

  return (
    <div className="h-full min-h-0 flex flex-col gap-6 p-6 overflow-y-auto">
      <div>
        <h2 className="text-xl font-semibold">Extensions</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Currently registered API extensions (dynamic extension system) and the routes they contribute.
        </p>
      </div>

      {(extensions ?? []).length === 0 ? (
        <span className="text-muted-foreground">No extensions are currently registered.</span>
      ) : (
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const isExpanded = expandedNames.has(row.original.name);
              return (
                <Fragment key={row.id}>
                  <TableRow>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={row.getVisibleCells().length}>
                        <ExtensionDetailsPanel name={row.original.name} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      )}

      <AlertDialog open={deregisterTarget !== null} onOpenChange={(open) => !open && setDeregisterTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deregister extension?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deregisterTarget}</strong>, its routes, RBAC actions and any
              issued device keys. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deregisterExtension.isError && (
            <p className="text-sm text-red-600">{deregisterExtension.error.message}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeregister}
              disabled={deregisterExtension.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deregisterExtension.isPending ? "Deregistering..." : "Deregister"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
