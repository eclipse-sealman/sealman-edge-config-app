import DictionaryList from "@/components/Table/DictionaryList";
import Badge, { BadgeColor } from "@/components/Typography/Badge";
import {
  Heading,
  HeadingButton,
  HeadingColor,
} from "@/components/Typography/Heading";
import { ApiError } from "@/generated/edge-administration/api";
import {
  InformationCircleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { useParams } from "react-router-dom";
import useGetDeviceMetadata from "../../../../generated/edge-administration/hooks/device_metadata/useGetDeviceMetadata";
import type { DeviceMetadata } from "../../../../generated/edge-administration/hooks/useGetDevices/useGetDevices.types";
import DeviceMetadataEdit from "./DeviceMetadataEdit";

export default function DeviceMetadata() {
  const { deviceId } = useParams();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const deviceMetadata = useGetDeviceMetadata(deviceId ?? "");
  const apiError = deviceMetadata.isError
    ? (deviceMetadata.error as ApiError)
    : null;
  const typedDeviceMetadata = deviceMetadata.data
    ?.deviceMetadata as DeviceMetadata;

  const geoValue = typedDeviceMetadata?.geoLocation?.value;

  const [lat, lon] = geoValue ? geoValue.split(",").map((v) => v.trim()) : [];

  const geoLabel = [lat && `Latitude: ${lat}`, lon && `Longitude: ${lon}`]
    .filter(Boolean)
    .join(" ");

  const specialKeys = new Set(["geoLocation", "countryCode", "businessUnit"]);

  const genericEntries = typedDeviceMetadata
    ? Object.entries(typedDeviceMetadata)
        .filter(([key]) => !specialKeys.has(key))
        .reduce(
          (acc, [key, val]) => ({ ...acc, [key.charAt(0).toUpperCase() + key.slice(1)]: val?.value }),
          {} as Record<string, string | undefined>
        )
    : {};

  const tableData = Object.fromEntries(
    Object.entries({
      ...genericEntries,
      "Country-Code": typedDeviceMetadata?.countryCode?.value,
      "Geo-Location": geoLabel,
      "Business Unit": typedDeviceMetadata?.businessUnit?.value,
    }).sort(([a], [b]) => a.localeCompare(b))
  );

  if (isEditing) {
    return (
      <DeviceMetadataEdit
        deviceMetadata={typedDeviceMetadata || {}}
        stopEditing={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div>
      <Heading processing={deviceMetadata.isFetching} color={HeadingColor.Gray}>
        <InformationCircleIcon className="w-7 h-7 mr-1" />
        Device Metadata
        <HeadingButton onClick={() => setIsEditing(!isEditing)}>
          <PencilSquareIcon className="w-6 h-6 ml-5" />
          Edit
        </HeadingButton>
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
