import Button, { ButtonColor, ButtonSize } from "@/components/Input/Button";
import { Input } from "@/components/Input/FormElements";
import LatitudeLongitudeInput, { LocationErrors } from "@/components/Input/LatitudeLongitudeInput";
import DictionaryList from "@/components/Table/DictionaryList";
import { Heading, HeadingButton, HeadingColor } from "@/components/Typography/Heading";
import { InformationCircleIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import type { DeviceMetadata } from "../../../../generated/edge-administration/hooks/useGetDevices/useGetDevices.types";
import usePatchDeviceMetadata from "../../../../generated/edge-administration/hooks/device_metadata/usePatchDeviceMetadata";

export interface DeviceMetadataEditProps {
  deviceMetadata: DeviceMetadata;
  stopEditing: () => void;
}

const specialKeys = new Set(["geoLocation", "countryCode", "businessUnit"]);

export default function DeviceMetadataEdit({ deviceMetadata, stopEditing }: DeviceMetadataEditProps) {
  const { deviceId } = useParams();
  if (!deviceId) throw new Error("No deviceId in params.");
  const [deviceMetadataFormData, setDeviceMetadataFormData] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(deviceMetadata).map(([key, val]) => [key, val?.value ?? ""]))
  );
  const [locationErrors, setLocationErrors] = useState<LocationErrors>({ latitude: "", longitude: "" });
  const [newEntries, setNewEntries] = useState<{ key: string; value: string }[]>([]);
  const [deletedDeviceKeys, setDeletedDeviceKeys] = useState<Set<string>>(new Set());

  const patchDeviceMetadataMutation = usePatchDeviceMetadata();

  const onSubmit = async () => {
    if (locationErrors.latitude || locationErrors.longitude) {
      return;
    }

    const body = {
      ...deviceMetadataFormData,
      ...Object.fromEntries(Array.from(deletedDeviceKeys).map((key) => [key, null])),
      ...Object.fromEntries(
        newEntries.filter(({ key }) => key.trim() !== "").map(({ key, value }) => [key.trim(), value])
      ),
    };

    await patchDeviceMetadataMutation.query({ deviceId, body });
    stopEditing();
  }

  const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = ev.target;
    setDeviceMetadataFormData((formData) => ({
      ...formData,
      [name]: value,
    }));
  };

  const handleDeleteExistingKey = (key: string) => {
    setDeletedDeviceKeys((prev) => new Set(prev).add(key));
    setDeviceMetadataFormData((formData) => {
      const next = { ...formData };
      delete next[key];
      return next;
    });
  };

  const handleDeleteNewEntry = (index: number) => {
    setNewEntries((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (patchDeviceMetadataMutation.error) {
      toast.error(`Error while updating device metadata. ${patchDeviceMetadataMutation.error}`);
    }
  }, [patchDeviceMetadataMutation.isError, patchDeviceMetadataMutation.error]);

  const genericEntries = Object.fromEntries(
    Object.entries(deviceMetadataFormData)
      .filter(([key]) => !specialKeys.has(key) && !deletedDeviceKeys.has(key))
      .map(([key, value]) => [
        key.charAt(0).toUpperCase() + key.slice(1),
        <div key={key} className="flex items-center gap-2">
          <Input
            type="text"
            name={key}
            value={value}
            onChange={handleChange}
            className="p-1 inline-block w-full"
          />
          {deviceMetadata[key]?.source === "device" ? (
            <Button
              type="button"
              color={ButtonColor.Red}
              size={ButtonSize.Small}
              onClick={() => handleDeleteExistingKey(key)}
              aria-label={`Delete ${key} metadata key`}
              className="shrink-0 h-[34px] px-2 justify-center"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          ) : null}
        </div>,
      ])
  );

  const tableData = Object.fromEntries(
    Object.entries({
      ...genericEntries,
      "Country-Code": deletedDeviceKeys.has("countryCode") ? undefined : (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            name="countryCode"
            value={deviceMetadataFormData.countryCode ?? ""}
            onChange={handleChange}
            className="p-1 inline-block w-full"
          />
          {deviceMetadata.countryCode?.source === "device" ? (
            <Button
              type="button"
              color={ButtonColor.Red}
              size={ButtonSize.Small}
              onClick={() => handleDeleteExistingKey("countryCode")}
              aria-label="Delete countryCode metadata key"
              className="shrink-0 h-[34px] px-2 justify-center"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
      ),
      "Geo-Location": deletedDeviceKeys.has("geoLocation") ? undefined : (
        <div className="flex items-center gap-2">
          <LatitudeLongitudeInput
            latitude={geoLocationToLatLong(deviceMetadataFormData.geoLocation).latitude}
            longitude={geoLocationToLatLong(deviceMetadataFormData.geoLocation).longitude}
            onChange={(latitude, longitude, errors) => {
              setDeviceMetadataFormData((formData) => ({
                ...formData,
                geoLocation: latLongToGeoLocation(latitude, longitude),
              }));
              setLocationErrors(errors);
            }}
          />
          {deviceMetadata.geoLocation?.source === "device" ? (
            <Button
              type="button"
              color={ButtonColor.Red}
              size={ButtonSize.Small}
              onClick={() => handleDeleteExistingKey("geoLocation")}
              aria-label="Delete geoLocation metadata key"
              className="shrink-0 h-[34px] px-2 justify-center"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
      ),
      "Business Unit": deletedDeviceKeys.has("businessUnit") ? undefined : (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            name="businessUnit"
            value={deviceMetadataFormData.businessUnit ?? ""}
            onChange={handleChange}
            className="p-1 inline-block w-full"
          />
          {deviceMetadata.businessUnit?.source === "device" ? (
            <Button
              type="button"
              color={ButtonColor.Red}
              size={ButtonSize.Small}
              onClick={() => handleDeleteExistingKey("businessUnit")}
              aria-label="Delete businessUnit metadata key"
              className="shrink-0 h-[34px] px-2 justify-center"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          ) : null}
        </div>
      ),
    })
      .filter(([_, value]) => value !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
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

      <DictionaryList dictionary={tableData} processing={patchDeviceMetadataMutation.isPending} />

      {newEntries.map((entry, index) => (
        <div key={index} className="grid grid-cols-2 p-1 bg-white even:bg-slate-50 rounded-sm items-center border-t border-solid">
          <div className="pr-2">
            <Input
              type="text"
              placeholder="Key"
              value={entry.key}
              onChange={(e) =>
                setNewEntries((prev) =>
                  prev.map((item, i) => (i === index ? { ...item, key: e.target.value } : item))
                )
              }
              className="p-1 inline-block w-full font-medium"
            />
          </div>
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Value"
                value={entry.value}
                onChange={(e) =>
                  setNewEntries((prev) =>
                    prev.map((item, i) => (i === index ? { ...item, value: e.target.value } : item))
                  )
                }
                className="p-1 inline-block w-full"
              />
              <Button
                type="button"
                color={ButtonColor.Red}
                size={ButtonSize.Small}
                onClick={() => handleDeleteNewEntry(index)}
                aria-label="Delete new metadata key"
                className="shrink-0 h-[34px] px-2 justify-center"
              >
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
        </div>
      ))}

        <Button
          type="button"
          size={ButtonSize.Small}
          onClick={() => setNewEntries((prev) => [...prev, { key: "", value: "" }])}
          className="mt-2"
        >
          <PlusIcon className="w-4 h-4 mr-1" />
          Add field
        </Button>
      </div>
    );
  }

  function latLongToGeoLocation(latitude?: string | number, longitude?: string | number): string {
    if (
      latitude === undefined ||
      longitude === undefined ||
      latitude === "" ||
      longitude === ""
    ) {
      return "";
    }
    return `${latitude},${longitude}`;
}

function geoLocationToLatLong(geoLocation?: string): { latitude: string; longitude: string } {
  if (!geoLocation) return { latitude: "", longitude: "" };
  const [latitude, longitude] = geoLocation.split(",");
  return {
    latitude: latitude?.trim() ?? "",
    longitude: longitude?.trim() ?? "",
  };
}