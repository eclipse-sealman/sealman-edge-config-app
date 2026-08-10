import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { inputClass, validateFields } from "@/features/PlatformTypes/FieldValueInput";
import { components } from "@/generated/edge-administration/types";
import useGetServiceTypes from "@/generated/edge-administration/hooks/service_types/useGetServiceTypes";
import { usePostService } from "@/generated/edge-administration/hooks/services/usePostService";
import { useUpdateService } from "@/generated/edge-administration/hooks/services/useUpdateService";
import { useDeleteService } from "@/generated/edge-administration/hooks/services/useDeleteService";
import TypeFieldsForm from "./TypeFieldsForm";

type ResolvedField = components["schemas"]["ResolvedField"];

export interface ExistingService {
  service_id: string;
  type_id: string;
  service_data: Record<string, ResolvedField>;
}

interface props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  endpointId: string;
  /** The port actually observed on the network - locks that field to this value. Omit for a
   * manual "Add Service" flow with no scan context, in which case the port field stays editable. */
  port?: number;
  defaultTypeId?: string | null;
  existingService?: ExistingService | null;
  onCreated: () => void;
}

export default function AssignServiceDialog({
  open,
  onOpenChange,
  endpointId,
  port,
  defaultTypeId,
  existingService,
  onCreated,
}: props) {
  const { data: serviceTypes } = useGetServiceTypes();
  const { postService, isPending: isCreating } = usePostService();
  const { updateService, isPending: isUpdating } = useUpdateService();
  const { deleteService, isPending: isDeleting } = useDeleteService();
  const isPending = isCreating || isUpdating || isDeleting;
  const isEdit = Boolean(existingService);
  const isLocked = port !== undefined;

  const [typeId, setTypeId] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  const selectedType = (serviceTypes ?? []).find((t) => t.type_id === typeId);
  const portFieldKey = useMemo(() => {
    if (!selectedType) return null;
    return Object.entries(selectedType.mapping).find(([, role]) => role === "port")?.[0] ?? null;
  }, [selectedType]);
  // See AssignEndpointDialog's identical `isSameExistingType` - without this, a service type's
  // own default port (a `changeable: false` field) would lock the port field before anything's
  // actually been saved, making it impossible to type in a different port on first creation.
  const isSameExistingType = existingService?.type_id === selectedType?.type_id;

  useEffect(() => {
    if (!open) return;
    setTypeId(existingService?.type_id ?? defaultTypeId ?? "");
    setError(null);
  }, [open, defaultTypeId, existingService]);

  useEffect(() => {
    if (!selectedType) {
      setValues({});
      return;
    }
    const initial: Record<string, unknown> = {};
    for (const [key, definition] of Object.entries(selectedType.fields)) {
      if (key === portFieldKey && isLocked) {
        initial[key] = port;
      } else if (isSameExistingType) {
        initial[key] = existingService?.service_data[key]?.value ?? definition.default ?? null;
      } else {
        initial[key] = definition.default ?? null;
      }
    }
    setValues(initial);
  }, [selectedType, portFieldKey, port, isLocked, existingService, isSameExistingType]);

  const handleSubmit = async () => {
    if (!selectedType) {
      setError("Select a service type");
      return;
    }
    const validationError = validateFields(values, selectedType.fields);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    try {
      if (existingService && existingService.type_id === selectedType.type_id) {
        await updateService({ serviceId: existingService.service_id, body: { service_data: values } });
        toast.success(`Service "${selectedType.label}" updated`);
      } else {
        if (existingService) {
          await deleteService(existingService.service_id);
        }
        await postService({ endpointId, body: { type_id: selectedType.type_id, service_data: values } });
        toast.success(`Service "${selectedType.label}" ${existingService ? "reassigned" : "created"}`);
      }
      onCreated();
      onOpenChange(false);
    } catch {
      setError("Failed to save service");
    }
  };

  const description = isEdit
    ? isLocked
      ? `Change the type or field values for port ${port}.`
      : "Change the type or field values for this service."
    : isLocked
      ? `Assign port ${port} to a service type using its current, actual value on the network.`
      : "Add a new service to this endpoint.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Service" : "Assign Service"}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Service Type *</label>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={inputClass}>
              <option value="">Select a type...</option>
              {(serviceTypes ?? []).map((t) => (
                <option key={t.type_id} value={t.type_id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {selectedType && (
            <TypeFieldsForm
              fields={selectedType.fields}
              values={values}
              onChange={(key, value) => setValues((v) => ({ ...v, [key]: value }))}
              lockedFieldKey={isLocked ? portFieldKey : null}
              lockSavedValues={isSameExistingType}
            />
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !selectedType}>
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
