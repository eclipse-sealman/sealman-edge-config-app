import { useEffect, useState } from "react";
import Badge, { BadgeColor } from "@/components/Typography/Badge";
import DictionaryList from "@/components/Table/DictionaryList";
import { Heading, HeadingButton, HeadingColor } from "@/components/Typography/Heading";
import { InformationCircleIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { components } from "@/generated/edge-administration/types";
import FieldValueInput from "@/features/PlatformTypes/FieldValueInput";
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
  const [error, setError] = useState<string | null>(null);

  const patchDeviceMetadataMutation = usePatchDeviceMetadata();

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

  const tableData = Object.fromEntries(
    sortedEntries.map(([key, entry]) => [
      entry.field?.label ?? key,
      <div key={key}>
        <FieldValueInput
          definition={entry.field ?? { type: "string" }}
          value={formValues[key]}
          onChange={(value) => setFormValues((prev) => ({ ...prev, [key]: value }))}
          placeholder={entry.field?.label ?? key}
        />
        {entry.field?.description && (
          <p className="text-xs text-muted-foreground mt-1">{entry.field.description}</p>
        )}
      </div>,
    ]),
  );

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
    </div>
  );
}
