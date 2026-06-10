import { useEffect, useRef, useState } from "react";
import { edgeConfigApi, MetadataKeyOptions } from "@/api/edgeConfig/edgeConfigApi";
import { useQueryClient } from "@tanstack/react-query";
import { PlusIcon, TrashIcon, ChevronDownIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import LatitudeLongitudeInput, { LocationErrors } from "@/components/Input/LatitudeLongitudeInput";

const GEO_KEY = "geoLocation";

function latLongToGeoLocation(lat: string, lng: string) {
  if (!lat.trim() && !lng.trim()) return "";
  return `${lat},${lng}`;
}
function geoLocationToLatLong(geo: string) {
  if (!geo) return { latitude: "", longitude: "" };
  const [lat, lng] = geo.split(",");
  return { latitude: lat?.trim() ?? "", longitude: lng?.trim() ?? "" };
}

function MetaTextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder=""
      className="w-full h-8 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
    />
  );
}

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
  // track user-added options (not from API) — only one allowed at a time
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
    <div ref={wrapRef} className="relative">
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

const fieldCls =
  "w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

// ─── Create Device Dialog ─────────────────────────────────────────────────────
export default function DeviceManageDialog() {
  const [open, setOpen] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [authType, setAuthType] = useState("sas");
  const [registrationId, setRegistrationId] = useState("");
  const [predefinedValues, setPredefinedValues] = useState<Record<string, string>>({});
  const [metaKeyOptions, setMetaKeyOptions] = useState<Record<string, MetadataKeyOptions>>({});
  const [metaValueOptions, setMetaValueOptions] = useState<Record<string, string[]>>({});
  const [predefinedKeys, setPredefinedKeys] = useState<string[]>([]);
  const [extraRows, setExtraRows] = useState<{ key: string; value: string }[]>([]);
  const [locationErrors, setLocationErrors] = useState<LocationErrors>({ latitude: "", longitude: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) return;
    edgeConfigApi
      .getMetadataKeys()
      .then((keysMap: Record<string, MetadataKeyOptions>) => {
        const all = Array.from(new Set([GEO_KEY, ...Object.keys(keysMap)])).sort((a, b) => a.localeCompare(b));
        setPredefinedKeys(all);
        setPredefinedValues(Object.fromEntries(all.map((k) => [k, ""])));
        setMetaKeyOptions(keysMap);
      })
      .catch(() => {
        setPredefinedKeys([GEO_KEY]);
        setPredefinedValues({ [GEO_KEY]: "" });
        setMetaKeyOptions({});
      });
    edgeConfigApi.getDeviceMetaValues().then(setMetaValueOptions).catch(() => setMetaValueOptions({}));
  }, [open]);

  const openDialog = () => {
    setOpen(true); setDeviceId(""); setAuthType("sas"); setRegistrationId("");
    setExtraRows([]); setLocationErrors({ latitude: "", longitude: "" });
    setError(null); setSuccess(null);
  };
  const closeDialog = () => { setOpen(false); setError(null); setSuccess(null); };

  const handleCreate = async () => {
    if (!deviceId.trim()) { setError("Device ID is required"); return; }
    if (locationErrors.latitude || locationErrors.longitude) {
      setError("Please fix the geo-location errors before submitting."); return;
    }
    setLoading(true); setError(null);
    try {
      const meta: Record<string, string> = {};
      for (const [k, v] of Object.entries(predefinedValues)) if (v.trim()) meta[k] = v.trim();
      for (const { key, value } of extraRows) if (key.trim() && value.trim()) meta[key.trim()] = value.trim();
      await edgeConfigApi.createDevice(
        deviceId.trim(), authType,
        Object.keys(meta).length > 0 ? meta : undefined,
        registrationId.trim() || undefined,
      );
      setSuccess(`Device "${deviceId}" created successfully.`);
      queryClient.invalidateQueries({ queryKey: ["get", "/devices", "withCountryData"] });
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e as Error).message,
      );
    } finally { setLoading(false); }
  };

  const displayLabel = (key: string) =>
    key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();

  return (
    <>
      <button
        onClick={openDialog}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm hover:bg-blue-600 active:scale-95 transition-all whitespace-nowrap"
      >
        Add Device
      </button>

      {open && <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[1px]" onClick={closeDialog} />}

      {open && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Create Device</h2>

          <div className="flex flex-col gap-4">
            <div>
              <label className={labelCls}>Device ID <span className="text-red-500">*</span></label>
              <input type="text" value={deviceId} onChange={(e) => setDeviceId(e.target.value)}
                placeholder="e.g. 90909090" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Auth Type</label>
              <select value={authType} onChange={(e) => setAuthType(e.target.value)} className={fieldCls}>
                <option value="sas">sas</option>
                <option value="tpm" disabled>tpm</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>
                Registration ID <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <input type="text" value={registrationId} onChange={(e) => setRegistrationId(e.target.value)}
                placeholder="Leave blank to use Device ID" className={fieldCls} />
            </div>

            <div>
              <label className={labelCls}>
                Meta <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </label>
              <div className="rounded-lg border border-gray-200 overflow-visible">
                {/* Header */}
                <div className="grid grid-cols-[2fr_3fr] gap-3 px-3 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Key</span>
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Value</span>
                </div>

                {predefinedKeys.map((key) => {
                  if (key === GEO_KEY) {
                    return (
                      <div key={key} className="border-b border-gray-100 px-3 py-2.5">
                        <span className="text-sm text-gray-700 font-medium block mb-1.5">Geo Location</span>
                        <LatitudeLongitudeInput
                          key={`geo-${open}`}
                          latitude={geoLocationToLatLong(predefinedValues[GEO_KEY] ?? "").latitude}
                          longitude={geoLocationToLatLong(predefinedValues[GEO_KEY] ?? "").longitude}
                          onChange={(lat, lng, errors) => {
                            setPredefinedValues((p) => ({ ...p, [GEO_KEY]: latLongToGeoLocation(lat, lng) }));
                            setLocationErrors(errors);
                          }}
                        />
                      </div>
                    );
                  }
                  const opts = metaKeyOptions[key];
                  const existing = metaValueOptions[key] ?? [];
                  return (
                    <div key={key} className="grid grid-cols-[2fr_3fr] gap-3 px-3 py-2 border-b border-gray-100 items-center last:border-b-0">
                      <span className="text-sm text-gray-700 font-medium truncate">{displayLabel(key)}</span>
                      {opts?.prepopulate ? (
                        <MetaValueInput
                          value={predefinedValues[key] ?? ""}
                          options={existing}
                          allowAddition={opts.allowAddition}
                          onChange={(v) => setPredefinedValues((p) => ({ ...p, [key]: v }))}
                        />
                      ) : (
                        <MetaTextInput
                          value={predefinedValues[key] ?? ""}
                          onChange={(v) => setPredefinedValues((p) => ({ ...p, [key]: v }))}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Extra custom rows */}
                {extraRows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_32px] gap-2 px-3 py-2 border-b border-gray-100 items-center bg-blue-50/40">
                    <input type="text" value={row.key} placeholder="key"
                      onChange={(e) => setExtraRows((p) => p.map((r, j) => j === i ? { ...r, key: e.target.value } : r))}
                      className="h-8 px-2.5 rounded-md border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition-all"
                    />
                    <input type="text" value={row.value} placeholder="value"
                      onChange={(e) => setExtraRows((p) => p.map((r, j) => j === i ? { ...r, value: e.target.value } : r))}
                      className="h-8 px-2.5 rounded-md border border-gray-200 text-sm bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/30 transition-all"
                    />
                    <button onClick={() => setExtraRows((p) => p.filter((_, j) => j !== i))}
                      className="flex items-center justify-center w-8 h-8 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setExtraRows((p) => [...p, { key: "", value: "" }])}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-blue-600 hover:bg-blue-50/60 transition-colors border-t border-dashed border-gray-200 rounded-b-lg"
                >
                  <span className="flex items-center justify-center w-4 h-4 rounded-full border border-blue-300 shrink-0">
                    <PlusIcon className="w-2.5 h-2.5" />
                  </span>
                  Add custom field
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">{error}</p>}
            {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">{success}</p>}
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
            <button onClick={closeDialog}
              className="text-sm px-4 py-1.5 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">
              {success ? "Close" : "Cancel"}
            </button>
            {!success && (
              <button onClick={handleCreate} disabled={loading}
                className="text-sm px-5 py-1.5 text-white rounded-md bg-blue-700 hover:bg-blue-600 font-medium shadow-sm disabled:opacity-50 transition-colors">
                {loading ? "Processing..." : "Create"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}

interface DeleteDeviceDialogProps { deviceId: string; onClose: () => void; }

export function DeleteDeviceDialog({ deviceId, onClose }: DeleteDeviceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    setLoading(true); setError(null);
    try {
      await edgeConfigApi.deleteDevice(deviceId);
      setSuccess(`Device "${deviceId}" deleted successfully.`);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["get", "/devices", "withCountryData"] }), 6000);
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e as Error).message,
      );
    } finally { setLoading(false); }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[1px]" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Delete Device</h2>
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelCls}>Device ID</label>
            <input type="text" value={deviceId} disabled
              className="w-full h-9 border border-gray-200 rounded-md px-3 text-sm bg-gray-50 text-gray-500 cursor-not-allowed" />
          </div>
          {!success && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              This will permanently remove the device from SEMS, IoTHub, and the database.
            </p>
          )}
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">{success}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
          <button onClick={onClose}
            className="text-sm px-4 py-1.5 border border-gray-200 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">
            {success ? "Close" : "Cancel"}
          </button>
          {!success && (
            <button onClick={handleDelete} disabled={loading}
              className="text-sm px-5 py-1.5 text-white rounded-md bg-red-600 hover:bg-red-500 font-medium shadow-sm disabled:opacity-50 transition-colors">
              {loading ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}