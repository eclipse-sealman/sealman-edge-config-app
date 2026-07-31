import { useEffect, useState } from "react";
import Badge, { BadgeColor } from "@/components/Typography/Badge";
import DictionaryList from "@/components/Table/DictionaryList";
import { Heading, HeadingButton, HeadingColor } from "@/components/Typography/Heading";
import { InformationCircleIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { components } from "@/generated/edge-administration/types";
import FieldValueInput, { compactInputClass } from "@/features/PlatformTypes/FieldValueInput";
import usePatchDeviceMetadata from "../../../../generated/edge-administration/hooks/device_metadata/usePatchDeviceMetadata";

type DeviceMetadataEntry = components["schemas"]["DeviceMetadataEntry"];

export interface DeviceMetadataEditProps {
  deviceMetadata: Record<string, DeviceMetadataEntry>;
  stopEditing: () => void;
}

export default function DeviceMetadataEdit({ deviceMetadata, stopEditing }: DeviceMetadataEditProps) {
  const { deviceId } = useParams();
  if (!deviceId) throw new Error("No deviceId in params.");

  const [formValues, setFormValues] = useState<Record<string, unknown>>(
    Object.fromEntries(Object.entries(deviceMetadata).map(([key, entry]) => [key, entry.value])),
  );
  // Keys the user has added in this session that aren't part of `deviceMetadata` yet - rendered
  // as plain, schema-less fields (same as any other extra key already on the device).
  const [newKeys, setNewKeys] = useState<string[]>([]);
  const [newKeyInput, setNewKeyInput] = useState("");
  const [newValueInput, setNewValueInput] = useState("");
  // Existing (already-saved) keys removed in this session - hidden from the form immediately,
  // and sent as `null` in the PATCH so the backend actually deletes them (see patch_data in
  // db/merge.py: omitting a key leaves it unchanged, only an explicit null removes it).
  const [deletedKeys, setDeletedKeys] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const patchDeviceMetadataMutation = usePatchDeviceMetadata();

  const handleAddField = () => {
    const key = newKeyInput.trim();
    if (!key) {
      toast.error("Enter a field name");
      return;
    }
    if (key in formValues || newKeys.includes(key)) {
      toast.error(`"${key}" already exists`);
      return;
    }
    setNewKeys((prev) => [...prev, key]);
    setFormValues((prev) => ({ ...prev, [key]: newValueInput }));
    setNewKeyInput("");
    setNewValueInput("");
  };

  const handleRemoveNewField = (key: string) => {
    setNewKeys((prev) => prev.filter((k) => k !== key));
    setFormValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleDeleteExistingField = (key: string) => {
    setDeletedKeys((prev) => [...prev, key]);
    setFormValues((prev) => ({ ...prev, [key]: null }));
  };

  useEffect(() => {
    if (patchDeviceMetadataMutation.error) {
      toast.error(`Error while updating device metadata. ${patchDeviceMetadataMutation.error}`);
    }
  }, [patchDeviceMetadataMutation.isError, patchDeviceMetadataMutation.error]);

  const sortedEntries = Object.entries(deviceMetadata).sort(([keyA, a], [keyB, b]) =>
    (a.field?.label ?? keyA).localeCompare(b.field?.label ?? keyB),
  );

  const onSubmit = async () => {
    for (const [key, entry] of sortedEntries) {
      const value = formValues[key];
      const isEmpty = value === null || value === undefined || value === "";
      if (entry.field?.required && isEmpty) {
        setError(`"${entry.field.label}" is required`);
        return;
      }
    }
    setError(null);
    await patchDeviceMetadataMutation.query({ deviceId, body: formValues });
    stopEditing();
  };

  const tableData = Object.fromEntries([
    ...sortedEntries
      .filter(([key]) => !deletedKeys.includes(key))
      .map(([key, entry]) => [
        entry.field?.label ?? key,
        <div key={key}>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <FieldValueInput
                definition={entry.field ?? { type: "string" }}
                value={formValues[key]}
                onChange={(value) => setFormValues((prev) => ({ ...prev, [key]: value }))}
                placeholder={entry.field?.label ?? key}
              />
            </div>
            {!entry.field?.required && (
              <button
                type="button"
                onClick={() => handleDeleteExistingField(key)}
                className="shrink-0 text-muted-foreground hover:text-red-600"
                title={`Remove "${entry.field?.label ?? key}"`}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            )}
          </div>
          {entry.field?.description && (
            <p className="text-xs text-muted-foreground mt-1">{entry.field.description}</p>
          )}
        </div>,
      ] as const),
    ...newKeys.map((key) => [
      key,
      <div key={key} className="flex items-center gap-2">
        <FieldValueInput
          definition={{ type: "string" }}
          value={formValues[key]}
          onChange={(value) => setFormValues((prev) => ({ ...prev, [key]: value }))}
          placeholder={key}
        />
        <button
          type="button"
          onClick={() => handleRemoveNewField(key)}
          className="shrink-0 text-muted-foreground hover:text-red-600"
          title={`Remove "${key}"`}
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>,
    ] as const),
  ]);

  return (
    <div>
      <Heading processing={patchDeviceMetadataMutation.isPending} color={HeadingColor.Gray}>
        <InformationCircleIcon className="w-7 h-7 mr-1" />
        Device Metadata
        <HeadingButton onClick={onSubmit}>
          <PencilSquareIcon className="w-6 h-6 ml-5" />
          Save
        </HeadingButton>
        <HeadingButton onClick={() => stopEditing()}>
          <XMarkIcon className="w-6 h-6 ml-5" />
          Cancel
        </HeadingButton>
      </Heading>

      {error && (
        <div className="pt-4 pl-2">
          <Badge color={BadgeColor.Red}>{error}</Badge>
        </div>
      )}

      <DictionaryList dictionary={tableData} processing={patchDeviceMetadataMutation.isPending} />

      <div className="flex items-end gap-2 p-2 mt-2 border-t">
        <div className="w-1/3 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Field name</label>
          <input
            type="text"
            value={newKeyInput}
            onChange={(e) => setNewKeyInput(e.target.value)}
            placeholder="custom_field"
            className={compactInputClass}
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Value</label>
          <input
            type="text"
            value={newValueInput}
            onChange={(e) => setNewValueInput(e.target.value)}
            className={compactInputClass}
          />
        </div>
        <button
          type="button"
          onClick={handleAddField}
          className="shrink-0 flex items-center gap-1 px-3 h-8 rounded-md border border-slate-200 text-sm hover:bg-gray-50"
        >
          <PlusIcon className="w-4 h-4" />
          Add Field
        </button>
      </div>
    </div>
  );
}
