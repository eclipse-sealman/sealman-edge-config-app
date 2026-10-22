import { useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import { Cpu, Pencil } from "lucide-react";
import { WaterLoader } from "@/components/ui/water-loader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Badge from "@/components/Typography/Badge";
import { formatMetadataValue, validateFields } from "@/features/PlatformTypes/FieldValueInput";
import TypeFieldsForm from "@/features/Devices/Network/layouts/overview/TypeFieldsForm";
import CustomFieldsEditor from "@/features/Devices/Network/layouts/overview/CustomFieldsEditor";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import useGetDeviceMetadata from "@/generated/edge-administration/hooks/device_metadata/useGetDeviceMetadata";
import usePatchDeviceMetadata from "@/generated/edge-administration/hooks/device_metadata/usePatchDeviceMetadata";
import usePatchDeviceType from "@/generated/edge-administration/hooks/device_metadata/usePatchDeviceType";
import useGetDeviceTypes from "@/generated/edge-administration/hooks/device_types/useGetDeviceTypes";
import { getErrorMessage } from "@/lib/errors";

const GuardedButton = withPermissionRequiredTooltip(Button);

const isEmpty = (value: unknown) => value === null || value === undefined || value === "";

/**
 * The device is the gateway the endpoints and services on the Assets tab hang off, so its type and
 * metadata are edited here, right above them.
 */
export default function DeviceGatewayCard({ deviceId }: { deviceId: string }) {
  const metadataQuery = useGetDeviceMetadata(deviceId);
  const typesQuery = useGetDeviceTypes();
  const { query: patchMetadata, isPending: isPatchingMetadata } = usePatchDeviceMetadata();
  const { patchDeviceType, isPending: isRetyping } = usePatchDeviceType();

  const [editing, setEditing] = useState(false);
  const [typeId, setTypeId] = useState("");
  // Only what the user changed; the stored values underneath stay untouched until saving.
  const [edits, setEdits] = useState<Record<string, unknown>>({});
  const [deletedKeys, setDeletedKeys] = useState<Set<string>>(new Set());

  const metadata = metadataQuery.data;
  const types = typesQuery.data ?? [];
  const defaultType = types.find((t) => t.type_id === "default");
  const currentType = types.find((t) => t.type_id === metadata?.typeId);
  const isSaving = isPatchingMetadata || isRetyping;

  const stored = Object.fromEntries(Object.entries(metadata?.deviceMetadata ?? {}).map(([key, entry]) => [key, entry.value]));
  // The default type's fields apply to every device type; the selected type's own definitions win.
  const fields = { ...(defaultType?.fields ?? {}), ...(types.find((t) => t.type_id === typeId)?.fields ?? {}) };
  const typeChanged = typeId !== metadata?.typeId;

  const merged: Record<string, unknown> = { ...stored, ...edits };
  for (const key of deletedKeys) delete merged[key];
  // A retype pre-fills the new type's defaults, but never over a stored value.
  const formValues = Object.fromEntries(
    Object.entries(fields).map(([key, field]) => [key, merged[key] ?? (typeChanged ? field.default : null) ?? null]),
  );
  const customValues = Object.fromEntries(Object.entries(merged).filter(([key]) => !(key in fields)));

  const startEditing = () => {
    setTypeId(metadata?.typeId ?? "");
    setEdits({});
    setDeletedKeys(new Set());
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
      if (typeChanged) await patchDeviceType({ deviceId, body: { typeId, deviceMetadata: payload } });
      else if (Object.keys(payload).length > 0) await patchMetadata({ deviceId, body: payload });
      toast.success("Gateway updated");
      setEditing(false);
    } catch (error) {
      toast.error(`Could not update the gateway: ${getErrorMessage(error)}`);
    }
  };

  const viewEntries: [string, ReactNode][] = [];
  if (metadata) {
    viewEntries.push(["Device Type", <Badge>{currentType?.label ?? metadata.typeId}</Badge>]);
    Object.entries(metadata.deviceMetadata)
      .map(([key, entry]) => [entry.field?.label ?? key, formatMetadataValue(entry.value, entry.field ?? { type: "string" })] as const)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([label, value]) => viewEntries.push([label, value]));
  }

  return (
    <section className="overflow-hidden rounded-xl border-2 border-l-8 border-blue-600/30 border-l-blue-600 bg-background shadow-md">
      <header className="flex items-start justify-between gap-4 border-b bg-blue-50/60 px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-blue-600 p-3 text-white shadow-sm">
            <Cpu className="h-7 w-7" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Gateway</p>
            <h2 className="text-2xl font-semibold leading-none tracking-tight">{deviceId}</h2>
            <p className="text-sm text-muted-foreground">The endpoints and services of this device are connected through it.</p>
          </div>
        </div>
        {metadata &&
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
          ))}
      </header>

      <div className="p-6">
        {metadataQuery.isLoading && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <WaterLoader /> Loading gateway...
          </p>
        )}
        {metadataQuery.isError && <p className="text-sm text-destructive">Failed to load the gateway data.</p>}

        {metadata && !editing && (
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {viewEntries.map(([label, value]) => (
              <div key={label} className="min-w-0 space-y-0.5">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="truncate text-sm font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        {metadata && editing && (
          <div className="max-w-2xl space-y-6">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Device Type *</label>
              <Select value={typeId} onValueChange={setTypeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a device type..." />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.type_id} value={type.type_id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {typeChanged && (
                <p className="text-xs text-muted-foreground">
                  Stored values are kept: fields of the new type are pre-filled, everything else stays as custom fields.
                </p>
              )}
            </div>

            {Object.keys(fields).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground">Metadata</h3>
                <TypeFieldsForm
                  fields={fields}
                  values={formValues}
                  onChange={setValue}
                  onDelete={deleteValue}
                  lockSavedValues={false}
                />
              </div>
            )}

            <div className="space-y-2 border-t pt-4">
              <h3 className="text-xs font-semibold text-muted-foreground">Custom Fields</h3>
              <CustomFieldsEditor customValues={customValues} onChange={setValue} onDelete={deleteValue} onAdd={setValue} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
