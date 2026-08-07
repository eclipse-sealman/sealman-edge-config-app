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
import useGetEndpointTypes from "@/generated/edge-administration/hooks/endpoint_types/useGetEndpointTypes";
import { usePostEndpoint } from "@/generated/edge-administration/hooks/endpoints/usePostEndpoint";
import { useUpdateEndpoint } from "@/generated/edge-administration/hooks/endpoints/useUpdateEndpoint";
import { useDeleteEndpoint } from "@/generated/edge-administration/hooks/endpoints/useDeleteEndpoint";
import TypeFieldsForm from "./TypeFieldsForm";

type ResolvedField = components["schemas"]["ResolvedField"];

export interface ExistingEndpoint {
  endpoint_id: string;
  type_id: string;
  endpoint_data: Record<string, ResolvedField>;
}

interface props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
  /** The live IP this endpoint is being assigned at, if any. Omitted for a manually-added
   * endpoint that isn't (yet) live/discovered on the network - in that case nothing is
   * pre-filled or locked, and the admin fills in every field (including the built-in IP field)
   * by hand. */
  ip?: string;
  defaultTypeId?: string | null;
  existingEndpoint?: ExistingEndpoint | null;
  onCreated: () => void;
}

export default function AssignEndpointDialog({
  open,
  onOpenChange,
  deviceId,
  ip,
  defaultTypeId,
  existingEndpoint,
  onCreated,
}: props) {
  const { data: endpointTypes } = useGetEndpointTypes();
  const { postEndpoint, isPending: isCreating } = usePostEndpoint();
  const { updateEndpoint, isPending: isUpdating } = useUpdateEndpoint();
  const { deleteEndpoint, isPending: isDeleting } = useDeleteEndpoint();
  const isPending = isCreating || isUpdating || isDeleting;
  const isEdit = Boolean(existingEndpoint);

  const [typeId, setTypeId] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  const selectedType = (endpointTypes ?? []).find((t) => t.type_id === typeId);
  const ipFieldKey = useMemo(() => {
    if (!selectedType || !ip) return null;
    return Object.entries(selectedType.mapping).find(([, role]) => role === "ip")?.[0] ?? null;
  }, [selectedType, ip]);

  useEffect(() => {
    if (!open) return;
    setTypeId(existingEndpoint?.type_id ?? defaultTypeId ?? "");
    setError(null);
  }, [open, defaultTypeId, existingEndpoint]);

  useEffect(() => {
    if (!selectedType) {
      setValues({});
      return;
    }
    const isSameExistingType = existingEndpoint?.type_id === selectedType.type_id;
    const initial: Record<string, unknown> = {};
    for (const [key, definition] of Object.entries(selectedType.fields)) {
      if (key === ipFieldKey && ip) {
        initial[key] = ip;
      } else if (isSameExistingType) {
        initial[key] = existingEndpoint?.endpoint_data[key]?.value ?? definition.default ?? null;
      } else {
        initial[key] = definition.default ?? null;
      }
    }
    setValues(initial);
  }, [selectedType, ipFieldKey, ip, existingEndpoint]);

  const handleSubmit = async () => {
    if (!selectedType) {
      setError("Select an endpoint type");
      return;
    }
    const validationError = validateFields(values, selectedType.fields);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    try {
      if (existingEndpoint && existingEndpoint.type_id === selectedType.type_id) {
        await updateEndpoint({
          endpointId: existingEndpoint.endpoint_id,
          body: { endpoint_data: values },
        });
        toast.success(`Endpoint "${selectedType.label}" updated`);
      } else {
        if (existingEndpoint) {
          await deleteEndpoint(existingEndpoint.endpoint_id);
        }
        await postEndpoint({
          deviceId,
          body: { type_id: selectedType.type_id, endpoint_data: values },
        });
        toast.success(
          `Endpoint "${selectedType.label}" ${existingEndpoint ? "reassigned" : "created"}${ip ? ` for ${ip}` : ""}`
        );
      }
      onCreated();
      onOpenChange(false);
    } catch {
      setError("Failed to save endpoint");
    }
  };

  const title = isEdit ? "Edit Endpoint" : ip ? "Assign Endpoint" : "Add Endpoint";
  const description = isEdit
    ? `Change the type or field values for ${ip}.`
    : ip
      ? `Assign ${ip} to an endpoint type using its current, actual value on the network.`
      : "Manually add an endpoint that isn't currently discovered on the network.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Endpoint Type *</label>
            <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={inputClass}>
              <option value="">Select a type...</option>
              {(endpointTypes ?? []).map((t) => (
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
              lockedFieldKey={ipFieldKey}
            />
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending || !selectedType}>
            {isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Endpoint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
