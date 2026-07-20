import { useEffect, useRef, useState } from "react";
import Button, { ButtonColor, ButtonSize } from "@/components/Input/Button";
import { Input } from "@/components/Input/FormElements";
import LatitudeLongitudeInput, { LocationErrors } from "@/components/Input/LatitudeLongitudeInput";
import DictionaryList from "@/components/Table/DictionaryList";
import { Heading, HeadingButton, HeadingColor } from "@/components/Typography/Heading";
import { InformationCircleIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon, ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import type { DeviceMetadata } from "../../../../generated/edge-administration/hooks/useGetDevices/useGetDevices.types";
import usePatchDeviceMetadata from "../../../../generated/edge-administration/hooks/device_metadata/usePatchDeviceMetadata";
import { edgeConfigApi, MetadataKeyOptions } from "@/api/edgeConfig/edgeConfigApi";

export interface DeviceMetadataEditProps {
  deviceMetadata: DeviceMetadata;
  stopEditing: () => void;
}

const specialKeys = new Set(["geoLocation", "countryCode", "businessUnit"]);

function MetaValueInput({
  value,
  options: initialOptions,
  allowAddition,
  onChange,
}: {
  value: string;
  options: string[];
  allowAddition: boolean;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<string[]>(initialOptions);
  const [addedOptions, setAddedOptions] = useState<Set<string>>(new Set());
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [customError, setCustomError] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOptions((prev) => {
      const stillAdded = [...addedOptions].filter((o) => !initialOptions.includes(o));
      return [...initialOptions, ...stillAdded];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOptions]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const select = (v: string) => { onChange(v); setOpen(false); };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomInput(raw);
    const isDup = options.some((o) => o.toLowerCase() === raw.trim().toLowerCase());
    if (isDup && raw.trim()) {
      setCustomError(`"${raw.trim()}" already exists`);
      onChange("");
    } else {
      setCustomError("");
      onChange(raw);
    }
  };

  const commitCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed || customError) return;
    if (!options.includes(trimmed)) {
      setOptions((prev) => [...prev, trimmed]);
      setAddedOptions((prev) => new Set([...prev, trimmed]));
    }
    onChange(trimmed);
    setCustomMode(false);
    setCustomInput("");
    setCustomError("");
  };

  const removeOption = (opt: string) => {
    setOptions((prev) => prev.filter((o) => o !== opt));
    setAddedOptions((prev) => { const s = new Set(prev); s.delete(opt); return s; });
    if (value === opt) onChange("");
  };

  const cancelCustom = () => {
    setCustomMode(false);
    setCustomInput("");
    setCustomError("");
    onChange("");
  };

  if (customMode) {
    return (
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center gap-1.5">
          <input
            autoFocus
            type="text"
            value={customInput}
            onChange={handleCustomChange}
            onKeyDown={(e) => { if (e.key === "Enter") commitCustom(); if (e.key === "Escape") cancelCustom(); }}
            placeholder="Type a custom value…"
            className={[
              "flex-1 h-8 px-3 rounded-md border text-sm bg-white focus:outline-none focus:ring-2 transition-all",
              customError
                ? "border-red-400 focus:border-red-400 focus:ring-red-300/30"
                : "border-gray-200 focus:border-blue-400 focus:ring-blue-400/20",
            ].join(" ")}
          />
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); commitCustom(); }}
            disabled={!!customError || !customInput.trim()}
            className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            title="Confirm"
          >
            <CheckIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onMouseDown={(e) => { e.preventDefault(); cancelCustom(); }}
            className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors shrink-0"
            title="Cancel"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        {customError && (
          <span className="text-xs text-red-500 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
            {customError}
          </span>
        )}
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "w-full flex items-center h-8 rounded-md border bg-white text-sm transition-all focus:outline-none",
          open
            ? "border-blue-400 ring-2 ring-blue-400/20"
            : "border-gray-200 hover:border-gray-300",
        ].join(" ")}
      >
        <span className={["flex-1 text-left px-3 truncate", value ? "text-gray-800" : "text-gray-400"].join(" ")}>
          {value || "—"}
        </span>
        <ChevronDownIcon
          className={`w-3.5 h-3.5 shrink-0 mr-2.5 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden">
          <div
            onMouseDown={(e) => { e.preventDefault(); select(""); }}
            className={[
              "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer transition-colors select-none",
              !value ? "bg-blue-50 text-blue-600 font-medium" : "text-gray-400 hover:bg-gray-50",
            ].join(" ")}
          >
            {!value ? <CheckIcon className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 shrink-0" />}
            —
          </div>

          {options.length > 0 && <div className="border-t border-gray-100" />}

          <ul className="max-h-40 overflow-y-auto">
            {options.map((opt) => (
              <li
                key={opt}
                onMouseDown={(e) => { e.preventDefault(); select(opt); }}
                className={[
                  "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none transition-colors group",
                  opt === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700 hover:bg-slate-50",
                ].join(" ")}
              >
                {opt === value ? <CheckIcon className="w-3.5 h-3.5 shrink-0" /> : <span className="w-3.5 shrink-0" />}
                <span className="flex-1 truncate">{opt}</span>
                {addedOptions.has(opt) && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); removeOption(opt); }}
                    className="ml-auto flex items-center justify-center w-4 h-4 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                    title={`Remove "${opt}"`}
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          {allowAddition && addedOptions.size === 0 && (
            <div className="border-t border-gray-100">
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); setOpen(false); setCustomMode(true); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors font-medium"
              >
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-blue-100 shrink-0">
                  <PlusIcon className="w-2.5 h-2.5" />
                </span>
                Add custom value
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DeviceMetadataEdit({ deviceMetadata, stopEditing }: DeviceMetadataEditProps) {
  const { deviceId } = useParams();
  if (!deviceId) throw new Error("No deviceId in params.");
  const [deviceMetadataFormData, setDeviceMetadataFormData] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(deviceMetadata).map(([key, val]) => [key, val?.value ?? ""]))
  );
  const [locationErrors, setLocationErrors] = useState<LocationErrors>({ latitude: "", longitude: "" });
  const [newEntries, setNewEntries] = useState<{ key: string; value: string }[]>([]);
  const [deletedDeviceKeys, setDeletedDeviceKeys] = useState<Set<string>>(new Set());

  const [metaKeyOptions, setMetaKeyOptions] = useState<Record<string, MetadataKeyOptions>>({});
  const [metaValueOptions, setMetaValueOptions] = useState<Record<string, string[]>>({});

  const patchDeviceMetadataMutation = usePatchDeviceMetadata();

  useEffect(() => {
    edgeConfigApi
      .getMetadataKeys()
      .then((keysMap) => setMetaKeyOptions(keysMap))
      .catch(() => setMetaKeyOptions({}));
    edgeConfigApi
      .getDeviceMetaValues()
      .then(setMetaValueOptions)
      .catch(() => setMetaValueOptions({}));
  }, []);

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

  const renderGenericValue = (key: string, value: string) => {
    const opts = metaKeyOptions[key];
    if (opts?.prepopulate) {
      return (
        <MetaValueInput
          value={value}
          options={metaValueOptions[key] ?? []}
          allowAddition={opts.allowAddition}
          onChange={(v) =>
            setDeviceMetadataFormData((formData) => ({ ...formData, [key]: v }))
          }
        />
      );
    }
    return (
      <Input
        type="text"
        name={key}
        value={value}
        onChange={handleChange}
        className="p-1 inline-block w-full"
      />
    );
  };

  const genericEntries = Object.fromEntries(
    Object.entries(deviceMetadataFormData)
      .filter(([key]) => !specialKeys.has(key) && !deletedDeviceKeys.has(key))
      .map(([key, value]) => [
        key.charAt(0).toUpperCase() + key.slice(1),
        <div key={key} className="flex items-center gap-2">
          {renderGenericValue(key, value)}
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
          {metaKeyOptions.countryCode?.prepopulate ? (
            <MetaValueInput
              value={deviceMetadataFormData.countryCode ?? ""}
              options={metaValueOptions.countryCode ?? []}
              allowAddition={metaKeyOptions.countryCode.allowAddition}
              onChange={(v) =>
                setDeviceMetadataFormData((formData) => ({ ...formData, countryCode: v }))
              }
            />
          ) : (
            <Input
              type="text"
              name="countryCode"
              value={deviceMetadataFormData.countryCode ?? ""}
              onChange={handleChange}
              className="p-1 inline-block w-full"
            />
          )}
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
          {metaKeyOptions.businessUnit?.prepopulate ? (
            <MetaValueInput
              value={deviceMetadataFormData.businessUnit ?? ""}
              options={metaValueOptions.businessUnit ?? []}
              allowAddition={metaKeyOptions.businessUnit.allowAddition}
              onChange={(v) =>
                setDeviceMetadataFormData((formData) => ({ ...formData, businessUnit: v }))
              }
            />
          ) : (
            <Input
              type="text"
              name="businessUnit"
              value={deviceMetadataFormData.businessUnit ?? ""}
              onChange={handleChange}
              className="p-1 inline-block w-full"
            />
          )}
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