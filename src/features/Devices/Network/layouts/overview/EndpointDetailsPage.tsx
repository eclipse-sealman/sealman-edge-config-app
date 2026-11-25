import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ArrowLeft, Pencil, Repeat, Trash2 } from "lucide-react";
import { WaterLoader } from "@/components/ui/water-loader";
import { Button } from "@/components/ui/button";
import { Centered } from "@/features/Devices/Network/components";
import { useNetworkPageStore } from "@/features/Devices/Network/stores";
import useGetEndpoint from "@/generated/edge-administration/hooks/endpoints/useGetEndpoint";
import { useUpdateEndpoint } from "@/generated/edge-administration/hooks/endpoints/useUpdateEndpoint";
import { useDeleteEndpoint } from "@/generated/edge-administration/hooks/endpoints/useDeleteEndpoint";
import useGetEndpointTypes from "@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes";
import useGetServices from "@/generated/edge-administration/hooks/services/useGetServices";
import { validateFields } from "@/features/PlatformTypes/FieldValueInput";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import ReassignEndpointDialog from "./ReassignEndpointDialog";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import { endpointTitle, roleFieldKey } from "./endpointDisplay";
import { usePermissions } from "@/features/authorization/permissions/use-permissions";
import ExtensionOutlet from "@/features/Extensions/outlets/ExtensionOutlet";
import { useOutletUser } from "@/features/Extensions/outlets/useOutletUser";
import useGetDeviceMetadata from "@/generated/edge-administration/hooks/device_metadata/useGetDeviceMetadata";
import { edgeApi } from "@/generated/edge-administration/api";
import type { MappedEndpoint } from "@/generated/edge-administration/hooks/network/usePostNetworkOverview";
import AssetDetailsSection from "./AssetDetailsSection";
import AssetFieldValues from "./AssetFieldValues";
import EndpointServices from "./EndpointServices";

const GuardedButton = withPermissionRequiredTooltip(Button);

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every(
    (k) => k in b && deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]),
  );
}

function toValues(endpointData: Record<string, { value?: unknown }>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, resolved] of Object.entries(endpointData)) {
    out[key] = resolved.value ?? null;
  }
  return out;
}

interface props {
  endpointId: string;
  onBack: () => void;
  onUpdated: () => void;
  embedded?: boolean;
  networkEndpoint?: MappedEndpoint;
  initialServiceId?: string | null;
}

export default function EndpointDetailsPage({ endpointId, onBack, onUpdated, embedded = false, networkEndpoint, initialServiceId }: props) {
  const deviceId = useNetworkPageStore((s) => s.deviceId);
  const { data: endpoint, isLoading, isError, refetch } = useGetEndpoint(endpointId);
  const { data: endpointTypes } = useGetEndpointTypes();
  const { data: services, isLoading: isLoadingServices, isError: isServicesError, refetch: refetchServices } = useGetServices({ endpointId });
  const { updateEndpoint, isPending: isSaving } = useUpdateEndpoint();
  const queryClient = useQueryClient();
  const { deleteEndpoint, isPending: isDeleting } = useDeleteEndpoint();
  const { hasPermission: canWrite } = usePermissions({ deviceId, permissionKey: PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE });

  const outletUser = useOutletUser();
  const metadata = useGetDeviceMetadata(deviceId);
  const deviceTypeId = metadata.data?.typeId ?? "";

  const type = (endpointTypes ?? []).find((t) => t.type_id === endpoint?.type_id);
  const nameKey = roleFieldKey(type?.mapping, "name");
  const ipKey = roleFieldKey(type?.mapping, "ip");

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [deletedKeys, setDeletedKeys] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  // Only reset the form when we actually switch to a *different* endpoint, or the same endpoint
  // gets reassigned to a different type - not on every background refetch of the same one/type,
  // which would otherwise wipe in-progress edits.
  const initializedForRef = useRef<string | null>(null);
  // Values as last loaded from the server; lets us tell user edits apart from server-side changes.
  const baselineRef = useRef<Record<string, unknown>>({});

  useEffect(() => {
    if (!endpoint) return;
    const initializationKey = `${endpoint.endpoint_id}:${endpoint.type_id}`;
    if (initializedForRef.current === initializationKey) return;
    initializedForRef.current = initializationKey;
    const initial = toValues(endpoint.endpoint_data);
    baselineRef.current = initial;
    setValues(initial);
    setDeletedKeys(new Set());
    setIsDirty(false);
    setEditing(false);
  }, [endpoint]);

  const schemaFields = type?.fields ?? {};
  const storedValues = toValues(endpoint?.endpoint_data ?? {});
  const startEditing = () => {
    setValues(storedValues);
    baselineRef.current = storedValues;
    setDeletedKeys(new Set());
    setIsDirty(false);
    setDetailsOpen(true);
    setEditing(true);
  };

  const setFieldValue = (key: string, value: unknown) => {
    setValues((v) => ({ ...v, [key]: value }));
    setDeletedKeys((d) => {
      if (!d.has(key)) return d;
      const next = new Set(d);
      next.delete(key);
      return next;
    });
    setIsDirty(true);
  };

  const deleteFieldValue = (key: string) => {
    setValues((v) => {
      const next = { ...v };
      delete next[key];
      return next;
    });
    setDeletedKeys((d) => new Set(d).add(key));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!canWrite) return;
    // Only schema fields the user hasn't just deleted have anything to validate against -
    // custom fields are free-form, and a deleted field is about to be removed regardless.
    const fieldsToValidate = Object.fromEntries(
      Object.entries(schemaFields).filter(([key]) => !deletedKeys.has(key)),
    );
    const validationError = validateFields(values, fieldsToValidate);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    try {
      const payload: Record<string, unknown> = { ...values };
      for (const key of deletedKeys) {
        payload[key] = null;
      }
      const saved = await updateEndpoint({ endpointId, body: { endpoint_data: payload } });
      queryClient.setQueryData(edgeApi.queryOptions("get", "/endpoints/{endpoint_id}", {
        params: { path: { endpoint_id: endpointId } },
      }).queryKey, saved);
      toast.success("Endpoint updated");
      if (initializedForRef.current === `${saved.endpoint_id}:${saved.type_id}`) {
        setDeletedKeys(new Set());
        setIsDirty(false);
        setEditing(false);
        const fresh = toValues(saved.endpoint_data);
        baselineRef.current = fresh;
        // Use the write response so row IDs survive even if the following refetch fails.
        setValues((current) => Object.fromEntries(
          [...new Set([...Object.keys(current), ...Object.keys(fresh)])].map((key) => [
            key, deepEqual(current[key], values[key]) ? fresh[key] ?? null : current[key],
          ]),
        ));
      }
      await refetch();
      onUpdated();
    } catch {
      toast.error("Failed to update endpoint");
    }
  };

  // An extension panel changed this endpoint's data on the server: pull in the fresh values for
  // every key the user has not edited, and keep unsaved user edits untouched.
  const handleExtensionDataChanged = async () => {
    const result = await refetch();
    // The panel's write succeeded regardless of whether our refetch did.
    queryClient.invalidateQueries({ queryKey: ["get", "/{device}/metadata"] });
    // refetch resolves (not rejects) with status "error" and the stale data.
    if (!result?.data || result.isError) return;
    // The user may have switched endpoints while the refetch was in flight.
    if (initializedForRef.current !== `${result.data.endpoint_id}:${result.data.type_id}`) return;
    const fresh = toValues(result.data.endpoint_data);
    const baseline = baselineRef.current;
    baselineRef.current = fresh;
    setValues((current) => {
      const next: Record<string, unknown> = {};
      const keys = new Set([...Object.keys(baseline), ...Object.keys(fresh), ...Object.keys(current)]);
      for (const key of keys) {
        const untouched = deepEqual(current[key], baseline[key]) && (key in current) === (key in baseline);
        const take = untouched ? fresh : current;
        if (key in take) next[key] = take[key];
      }
      return next;
    });
    onUpdated();
  };

  // Hand the slot a stable callback so panel props do not change on every host render.
  const extensionDataChangedRef = useRef(handleExtensionDataChanged);
  useEffect(() => {
    extensionDataChangedRef.current = handleExtensionDataChanged;
  });
  const onExtensionDataChanged = useCallback(() => extensionDataChangedRef.current(), []);

  const handleDelete = async () => {
    if (!canWrite) return;
    try {
      await deleteEndpoint(endpointId);
      toast.success("Endpoint removed");
      setDeleteOpen(false);
      onUpdated();
      if (!embedded) onBack();
    } catch {
      toast.error("Failed to remove endpoint");
    }
  };

  return (
    <div className="space-y-3">
      {!embedded && <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
        <ArrowLeft /> Back to Overview
      </Button>}

      {isLoading && (
        <Centered>
          <p className="flex items-center gap-2 text-muted-foreground">
            <WaterLoader /> Loading endpoint...
          </p>
        </Centered>
      )}

      {isError && (
        <Centered>
          <p className="text-sm text-destructive">Failed to load this endpoint.</p>
        </Centered>
      )}

      {endpoint && (
        <>
          {!embedded && (
            <div>
              <h2 className="text-lg font-semibold leading-none tracking-tight">
                {endpointTitle({
                  typeLabel: endpoint.type_label,
                  name: nameKey ? storedValues[nameKey] : undefined,
                  ip: ipKey ? storedValues[ipKey] : undefined,
                })}
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">
                {endpoint.type_label}
                {endpoint.type_description ? ` · ${endpoint.type_description}` : ""}
              </p>
            </div>
          )}

          <AssetDetailsSection
            title="Endpoint details"
            open={detailsOpen || editing}
            onOpenChange={setDetailsOpen}
            actions={editing && canWrite ? (
              <>
                <Button variant="outline" size="sm" disabled={isSaving} onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" disabled={!isDirty || isSaving} onClick={handleSave}>{isSaving ? "Saving..." : "Save Changes"}</Button>
              </>
            ) : (
              <GuardedButton deviceId={deviceId} permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE}
                variant="outline" size="sm" onClick={startEditing}>
                <Pencil /> Edit endpoint
              </GuardedButton>
            )}>
            <AssetFieldValues
              fields={schemaFields}
              values={editing && canWrite ? values : storedValues}
              onChange={editing && canWrite ? setFieldValue : undefined}
              onDelete={editing && canWrite ? deleteFieldValue : undefined}
              disabled={isSaving}
            />
            {editing && canWrite && (
              <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                <GuardedButton deviceId={deviceId} permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE}
                  variant="outline" size="sm" onClick={() => setReassignOpen(true)} disabled={isSaving}>
                  <Repeat /> Reassign
                </GuardedButton>
                <GuardedButton deviceId={deviceId} permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE}
                  variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} disabled={isSaving}>
                  <Trash2 /> Remove Endpoint
                </GuardedButton>
              </div>
            )}

            {!metadata.isLoading && (
              <div className="mt-4">
                <ExtensionOutlet
                  target="endpoint"
                  placement="section"
                  context={{
                    user: outletUser,
                    deviceId,
                    deviceTypeId,
                    endpointId,
                    endpointTypeId: endpoint.type_id,
                    canEdit: canWrite,
                  }}
                  onDataChanged={onExtensionDataChanged}
                />
              </div>
            )}
          </AssetDetailsSection>

          {isLoadingServices && <p className="flex items-center gap-2 text-xs text-muted-foreground"><WaterLoader /> Loading services...</p>}
          {isServicesError && <p role="alert" className="text-sm text-destructive">
            Failed to load services. <Button variant="link" size="sm" onClick={() => void refetchServices()}>Retry</Button>
          </p>}
          <EndpointServices
            endpoint={networkEndpoint ?? { ...endpoint, source: "configured", status: "unknown", ports: [] }}
            deviceId={deviceId}
            services={services}
            initialServiceId={initialServiceId}
            onUpdated={() => { void refetchServices(); onUpdated(); }}
          />
        </>
      )}

      <ConfirmDeleteDialog
        open={deleteOpen && canWrite}
        onOpenChange={setDeleteOpen}
        title="Remove endpoint"
        description={`This removes "${endpoint?.type_label}" and all of its configured services. This cannot be undone.`}
        onConfirm={handleDelete}
        isPending={isDeleting}
      />

      {endpoint && (
        <ReassignEndpointDialog
          open={reassignOpen && canWrite}
          onOpenChange={setReassignOpen}
          endpointId={endpointId}
          currentTypeId={endpoint.type_id}
          currentData={endpoint.endpoint_data}
          onReassigned={async () => {
            await refetch();
            onUpdated();
          }}
        />
      )}
    </div>
  );
}
