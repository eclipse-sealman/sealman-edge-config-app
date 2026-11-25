import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { Pencil, Server, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateService } from "@/generated/edge-administration/hooks/services/useUpdateService";
import { useDeleteService } from "@/generated/edge-administration/hooks/services/useDeleteService";
import type { components } from "@/generated/edge-administration/types";
import { validateFields } from "@/features/PlatformTypes/FieldValueInput";
import ConfirmDeleteDialog from "./ConfirmDeleteDialog";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import { usePermissions } from "@/features/authorization/permissions/use-permissions";
import AssetFieldValues from "./AssetFieldValues";
import { edgeApi } from "@/generated/edge-administration/api";

const GuardedButton = withPermissionRequiredTooltip(Button);
type Service = components["schemas"]["ServiceResponse"];

interface props {
  service: Service;
  deviceId: string;
  onUpdated: () => void;
  actions?: ReactNode;
}

export default function ServiceDetailsPage({ service, deviceId, onUpdated, actions }: props) {
  const serviceId = service.service_id;
  const queryClient = useQueryClient();
  const servicesQueryKey = edgeApi.queryOptions("get", "/services", {
    params: { query: { endpoint_id: service.endpoint_id } },
  }).queryKey;
  const { updateService, isPending: isSaving } = useUpdateService();
  const { deleteService, isPending: isDeleting } = useDeleteService();
  const { hasPermission: canWrite } = usePermissions({ deviceId, permissionKey: PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE });

  const [values, setValues] = useState<Record<string, unknown>>({});
  const [deletedKeys, setDeletedKeys] = useState<Set<string>>(new Set());
  const [isDirty, setIsDirty] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const schemaFields = Object.fromEntries(Object.entries(service.service_data)
    .flatMap(([key, resolved]) => resolved.field ? [[key, resolved.field]] : []));
  const storedValues = Object.fromEntries(Object.entries(service.service_data).map(([key, resolved]) => [key, resolved.value]));
  const startEditing = () => {
    setValues(storedValues);
    setDeletedKeys(new Set());
    setIsDirty(false);
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
      const saved = await updateService({ serviceId, body: { service_data: payload } });
      queryClient.setQueryData<Service[]>(servicesQueryKey, (current) =>
        current?.map((item) => item.service_id === serviceId ? saved : item));
      toast.success("Service updated");
      setDeletedKeys(new Set());
      setIsDirty(false);
      setEditing(false);
      onUpdated();
    } catch {
      toast.error("Failed to update service");
    }
  };

  const handleDelete = async () => {
    if (!canWrite) return;
    try {
      await deleteService(serviceId);
      queryClient.setQueryData<Service[]>(servicesQueryKey, (current) =>
        current?.filter((item) => item.service_id !== serviceId));
      toast.success("Service removed");
      setDeleteOpen(false);
      onUpdated();
    } catch {
      toast.error("Failed to remove service");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-blue-100 p-2 text-blue-600"><Server className="h-4 w-4" aria-hidden="true" /></div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Service</p>
            <h3 className="text-sm font-semibold">{service.type_label}</h3>
            {service.type_description && (
              <p className="text-xs text-muted-foreground mt-1">{service.type_description}</p>
            )}
          </div>
        </div>
        <div className="ml-auto flex w-64 max-w-full flex-wrap items-center justify-end gap-2">
          {actions}
          {editing && canWrite ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={isSaving}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={!isDirty || isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
            </>
          ) : (
            <GuardedButton deviceId={deviceId} permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE}
              variant="outline" size="sm" onClick={startEditing}>
              <Pencil /> Edit service
            </GuardedButton>
          )}
        </div>
      </div>

      <AssetFieldValues
        fields={schemaFields}
        values={editing && canWrite ? values : storedValues}
        onChange={editing && canWrite ? setFieldValue : undefined}
        onDelete={editing && canWrite ? deleteFieldValue : undefined}
        disabled={isSaving}
      />
      {editing && canWrite && (
        <div className="border-t pt-4">
          <GuardedButton deviceId={deviceId} permissionKey={PERMISSION_KEYS.DEVICE_ENDPOINT_WRITE}
            variant="destructive" size="sm" onClick={() => setDeleteOpen(true)} disabled={isSaving}>
            <Trash2 /> Remove Service
          </GuardedButton>
        </div>
      )}

      <ConfirmDeleteDialog
        open={deleteOpen && canWrite}
        onOpenChange={setDeleteOpen}
        title="Remove service"
        description={`This removes "${service.type_label}". This cannot be undone.`}
        onConfirm={handleDelete}
        isPending={isDeleting}
      />
    </div>
  );
}
