import { useState } from "react";
import { toast } from "react-toastify";
import { Cpu, Pencil } from "lucide-react";
import { WaterLoader } from "@/components/ui/water-loader";
import { Button } from "@/components/ui/button";
import Badge from "@/components/Typography/Badge";
import { validateFields } from "@/features/PlatformTypes/FieldValueInput";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import useGetDeviceMetadata from "@/generated/edge-administration/hooks/device_metadata/useGetDeviceMetadata";
import usePatchDeviceMetadata from "@/generated/edge-administration/hooks/device_metadata/usePatchDeviceMetadata";
import useGetDeviceTypes from "@/generated/edge-administration/hooks/device_types/useGetDeviceTypes";
import { getErrorMessage } from "@/lib/errors";
import AssetDetailsSection from "@/features/Devices/Network/layouts/overview/AssetDetailsSection";
import AssetFieldValues from "@/features/Devices/Network/layouts/overview/AssetFieldValues";

const GuardedButton = withPermissionRequiredTooltip(Button);

const isEmpty = (value: unknown) => value === null || value === undefined || value === "";

/**
 * The device is the gateway the endpoints and services on the Assets tab hang off, so its type is
 * displayed and its metadata edited here, right above them.
 */
export default function DeviceGatewayCard({ deviceId }: { deviceId: string }) {
  const metadataQuery = useGetDeviceMetadata(deviceId);
  const typesQuery = useGetDeviceTypes();
  const { query: patchMetadata, isPending: isPatchingMetadata } = usePatchDeviceMetadata();

  const [editing, setEditing] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  // Only what the user changed; the stored values underneath stay untouched until saving.
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [deletedKeys, setDeletedKeys] = useState<Set<string>>(new Set());

  const metadata = metadataQuery.data;
  const types = typesQuery.data ?? [];
  const defaultType = types.find((t) => t.type_id === "default");
  const currentType = types.find((t) => t.type_id === metadata?.typeId);
  const isSaving = isPatchingMetadata;

  const stored = Object.fromEntries(Object.entries(metadata?.deviceMetadata ?? {}).map(([key, entry]) => [key, entry.value]));
  // The default type's fields apply to every device type; the current type's own definitions win.
  const fields = { ...(defaultType?.fields ?? {}), ...(currentType?.fields ?? {}) };

  const merged: Record<string, unknown> = { ...stored, ...edits };
  for (const key of deletedKeys) delete merged[key];
  const formValues = Object.fromEntries(
    Object.keys(fields).map((key) => [key, merged[key] ?? null]),
  );
  const customValues = Object.fromEntries(Object.entries(merged).filter(([key]) => !(key in fields)));

  const startEditing = () => {
    setEdits({});
    setDeletedKeys(new Set());
    setDetailsOpen(true);
    setEditing(true);
  };

  const setValue = (key: string, value: unknown) => {
    setEdits((prev) => ({ ...prev, [key]: value }));
    setDeletedKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const deleteValue = (key: string) => {
    setEdits((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setDeletedKeys((prev) => new Set(prev).add(key));
  };

  const handleSave = async () => {
    const fieldsToValidate = Object.fromEntries(Object.entries(fields).filter(([key]) => !deletedKeys.has(key)));
    const validationError = validateFields(formValues, fieldsToValidate);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    // In a PATCH, null removes a key - so emptied or deleted fields that were stored are sent as null.
    const payload: Record<string, unknown> = {};
    for (const [key, value] of Object.entries({ ...formValues, ...customValues })) {
      if (!isEmpty(value)) payload[key] = value;
      else if (key in stored) payload[key] = null;
    }
    for (const key of deletedKeys) {
      if (key in stored) payload[key] = null;
    }

    try {
      if (Object.keys(payload).length > 0) await patchMetadata({ deviceId, body: payload });
      toast.success("Gateway updated");
      setEditing(false);
    } catch (error) {
      toast.error(`Could not update the gateway: ${getErrorMessage(error)}`);
    }
  };

  return (
    <section className="rounded-lg border bg-background">
      <header className="flex items-center gap-3 px-4 py-3">
          <div className="rounded-md bg-blue-900 p-2 text-white">
            <Cpu className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-800">Device</p>
            <h2 className="break-words text-sm font-semibold">{deviceId}</h2>
            {metadata && <p className="text-xs text-muted-foreground">{currentType?.label ?? metadata.typeId}</p>}
          </div>
      </header>

      <div className="border-t px-4">
        <AssetDetailsSection
          title="Device details"
          open={detailsOpen || editing}
          onOpenChange={setDetailsOpen}
          actions={metadata &&
          (editing ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={isSaving}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          ) : (
            <GuardedButton
              deviceId={deviceId}
              permissionKey={PERMISSION_KEYS.DEVICE_METADATA_WRITE}
              variant="outline"
              size="sm"
              onClick={startEditing}
            >
              <Pencil /> Edit
            </GuardedButton>
          ))}>
        {metadata && (
          <AssetFieldValues fields={fields} values={editing ? merged : stored}
            onChange={editing ? setValue : undefined} onDelete={editing ? deleteValue : undefined}
            lockSavedValues={false} disabled={isSaving}>
            <div className="min-w-0 space-y-1">
              <dt className="flex h-5 items-center text-xs text-muted-foreground">Device Type</dt>
              <dd className="flex min-h-8 items-center text-sm font-medium">
                <Badge>{currentType?.label ?? metadata.typeId}</Badge>
              </dd>
            </div>
          </AssetFieldValues>
        )}
        </AssetDetailsSection>
        {metadataQuery.isLoading && (
          <p className="flex items-center gap-2 pb-3 text-sm text-muted-foreground">
            <WaterLoader /> Loading gateway...
          </p>
        )}
        {metadataQuery.isError && <p className="pb-3 text-sm text-destructive">Failed to load the gateway data.</p>}
      </div>
    </section>
  );
}
