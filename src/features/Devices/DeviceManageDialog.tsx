import { useEffect, useState } from "react";
import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";
import { useQueryClient } from "@tanstack/react-query";
import useGetDeviceTypes from "@/generated/edge-administration/hooks/device_types/useGetDeviceTypes";
import FieldValueInput from "@/features/PlatformTypes/FieldValueInput";

const fieldCls =
  "w-full h-9 px-3 rounded-md border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all";
const labelCls = "block text-sm font-medium text-gray-700 mb-1";

// ─── Create Device Dialog ─────────────────────────────────────────────────────
export default function DeviceManageDialog() {
  const [open, setOpen] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [authType, setAuthType] = useState("sas");
  const [registrationId, setRegistrationId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const deviceTypesQuery = useGetDeviceTypes();

  useEffect(() => {
    if (open) deviceTypesQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const deviceTypes = deviceTypesQuery.data ?? [];
  const selectedType = deviceTypes.find((t) => t.type_id === typeId);
  const defaultType = deviceTypes.find((t) => t.type_id === "default");
  // The default type's required fields apply to every device type (see
  // db/sqlalchemy/device.py:_effective_fields_for), so the form must surface and validate them
  // even when a non-default type is selected; the selected type's own definitions win on collision.
  const effectiveFields = { ...(defaultType?.fields ?? {}), ...(selectedType?.fields ?? {}) };

  const openDialog = () => {
    setOpen(true); setDeviceId(""); setAuthType("sas"); setRegistrationId("");
    setTypeId(""); setFieldValues({});
    setError(null); setSuccess(null);
  };
  const closeDialog = () => { setOpen(false); setError(null); setSuccess(null); };

  const handleTypeChange = (newTypeId: string) => {
    setTypeId(newTypeId);
    const type = deviceTypes.find((t) => t.type_id === newTypeId);
    const fields = { ...(defaultType?.fields ?? {}), ...(type?.fields ?? {}) };
    const defaults: Record<string, unknown> = {};
    for (const [key, field] of Object.entries(fields)) {
      defaults[key] = field.default ?? null;
    }
    setFieldValues(defaults);
  };

  const handleCreate = async () => {
    if (!deviceId.trim()) { setError("Device ID is required"); return; }
    if (!typeId) { setError("Device type is required"); return; }
    for (const [key, field] of Object.entries(effectiveFields)) {
      const value = fieldValues[key];
      const isEmpty = value === null || value === undefined || value === "";
      if (field.required && isEmpty) {
        setError(`"${field.label}" is required`);
        return;
      }
    }
    setLoading(true); setError(null);
    try {
      const meta: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(fieldValues)) {
        if (value !== null && value !== undefined && value !== "") meta[key] = value;
      }
      await edgeConfigApi.createDevice(
        deviceId.trim(), authType, typeId,
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
              <label className={labelCls}>Device Type <span className="text-red-500">*</span></label>
              <select
                value={typeId}
                onChange={(e) => handleTypeChange(e.target.value)}
                disabled={deviceTypesQuery.isLoading}
                className={fieldCls}
              >
                <option value="">
                  {deviceTypesQuery.isLoading ? "Loading device types…" : "Select a device type…"}
                </option>
                {deviceTypes.map((type) => (
                  <option key={type.type_id} value={type.type_id}>
                    {type.label}
                  </option>
                ))}
              </select>
              {deviceTypesQuery.isSuccess && deviceTypes.length === 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  No device types defined yet. Create one under Settings → Platform Types.
                </p>
              )}
            </div>

            {selectedType && Object.keys(effectiveFields).length > 0 && (
              <div>
                <label className={labelCls}>Fields</label>
                <div className="rounded-lg border border-gray-200 overflow-visible divide-y divide-gray-100">
                  {Object.entries(effectiveFields).map(([key, field]) => (
                    <div key={key} className="px-3 py-2.5">
                      <span className="text-sm text-gray-700 font-medium block mb-1">
                        {field.label}
                        {field.required && <span className="text-red-500"> *</span>}
                      </span>
                      {field.description && (
                        <p className="text-xs text-gray-400 mb-1.5">{field.description}</p>
                      )}
                      <FieldValueInput
                        definition={field}
                        value={fieldValues[key] ?? null}
                        onChange={(value) => setFieldValues((p) => ({ ...p, [key]: value }))}
                        placeholder={field.label}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

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