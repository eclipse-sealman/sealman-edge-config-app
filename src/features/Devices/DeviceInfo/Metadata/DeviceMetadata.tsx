import DictionaryList from "@/components/Table/DictionaryList";
import Badge, { BadgeColor } from "@/components/Typography/Badge";
import {
  Heading,
  HeadingButton,
  HeadingColor,
} from "@/components/Typography/Heading";
import { ApiError } from "@/generated/edge-administration/api";
import { PERMISSION_KEYS } from "@/features/authorization/permissions/permission-keys";
import {
  InformationCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useParams } from "react-router-dom";
import useGetDeviceMetadata from "../../../../generated/edge-administration/hooks/device_metadata/useGetDeviceMetadata";
import { formatMetadataValue } from "@/features/PlatformTypes/FieldValueInput";
import DeviceMetadataEdit from "./DeviceMetadataEdit";
import { withPermissionRequiredTooltip } from "@/features/authorization/permissions/withPermissionRequiredTooltip";

const GuardedHeadingButton = withPermissionRequiredTooltip(HeadingButton);

export default function DeviceMetadata() {
  const { deviceId } = useParams();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const deviceMetadata = useGetDeviceMetadata(deviceId ?? "");

  const apiError = deviceMetadata.isError
    ? (deviceMetadata.error as ApiError)
    : null;
  const entries = deviceMetadata.data?.deviceMetadata ?? {};

  const tableData = Object.fromEntries(
    Object.entries(entries)
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
        deviceMetadata={entries}
        stopEditing={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div>
      <Heading processing={deviceMetadata.isFetching} color={HeadingColor.Gray}>
        <InformationCircleIcon className="w-7 h-7 mr-1" />
        Device Metadata
        <GuardedHeadingButton
          permissionKey={PERMISSION_KEYS.DEVICE_METADATA_WRITE}
          deviceId={deviceId}
          onClick={() => setIsEditing(!isEditing)}
        >
          <PencilSquareIcon className="w-6 h-6 ml-5 cursor-pointer" />
          Edit
        </GuardedHeadingButton>
      </Heading>
      {deviceMetadata.isError && apiError ? (
        <div className="pt-4 pl-2">
          <Badge color={BadgeColor.Red}>
            ERROR:&nbsp;
            {apiError.statusCode === 404 ? (
              <span>Device does not have metadata</span>
            ) : (
              <>{apiError.message}</>
            )}
          </Badge>
        </div>
      ) : null}

      <DictionaryList
        dictionary={tableData}
        processing={deviceMetadata.isFetching}
      />
    </div>
  );
}
