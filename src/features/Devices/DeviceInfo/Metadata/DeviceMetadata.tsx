import DictionaryList from "@/components/Table/DictionaryList";
import Badge, { BadgeColor } from "@/components/Typography/Badge";
import {
  Heading,
  HeadingButton,
} from "@/components/Typography/Heading";
import { ApiError } from "@/generated/edge-administration/api";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import {
  InformationCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useParams } from "react-router-dom";
import { components } from "@/generated/edge-administration/types";
import { formatMetadataValue } from "@/features/PlatformTypes/FieldValueInput";
import DeviceMetadataEdit from "./DeviceMetadataEdit";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";

type DeviceMetadataEntry = components["schemas"]["DeviceMetadataEntry"];

const GuardedHeadingButton = withPermissionRequiredTooltip(HeadingButton);

export interface DeviceMetadataProps {
  deviceMetadata: Record<string, DeviceMetadataEntry>;
  isFetching: boolean;
  isError: boolean;
  error?: ApiError | null;
}

export default function DeviceMetadata({
  deviceMetadata,
  isFetching,
  isError,
  error,
}: DeviceMetadataProps) {
  const { deviceId } = useParams();
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const tableData = Object.fromEntries(
    Object.entries(deviceMetadata)
      .map(
        ([key, entry]) =>
          [
            entry.field?.label ?? key,
            formatMetadataValue(entry.value, entry.field ?? { type: "string" }),
          ] as const,
      )
      .sort(([a], [b]) => a.localeCompare(b)),
  );

  if (isEditing) {
    return (
      <DeviceMetadataEdit
        deviceMetadata={deviceMetadata}
        stopEditing={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div>
      <Heading
        processing={isFetching}
        description="Custom fields captured for this device."
        actions={
          <GuardedHeadingButton
            permissionKey={PERMISSION_KEYS.DEVICE_METADATA_WRITE}
            deviceId={deviceId}
            onClick={() => setIsEditing(!isEditing)}
          >
            <PencilSquareIcon className="w-4 h-4" />
            Edit
          </GuardedHeadingButton>
        }
      >
        <InformationCircleIcon className="w-5 h-5" />
        Device Metadata
      </Heading>
      {isError && error ? (
        <div className="pt-4 pl-2">
          <Badge color={BadgeColor.Red}>
            ERROR:&nbsp;
            {error.statusCode === 404 ? (
              <span>Device does not have metadata</span>
            ) : (
              <>{error.message}</>
            )}
          </Badge>
        </div>
      ) : null}

      <DictionaryList dictionary={tableData} processing={isFetching} />
    </div>
  );
}