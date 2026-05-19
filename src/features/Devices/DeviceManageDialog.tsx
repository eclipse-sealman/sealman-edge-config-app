import { useState } from "react";
import { edgeConfigApi } from "@/api/edgeConfig/edgeConfigApi";
import { useQueryClient } from "@tanstack/react-query";


export default function DeviceManageDialog() {
  const [open, setOpen] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [authType, setAuthType] = useState("sas");
  const [registrationId, setRegistrationId] = useState("");
  const [metaKey, setMetaKey] = useState("");
  const [metaValue, setMetaValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const openDialog = () => {
    setOpen(true);
    setDeviceId("");
    setAuthType("sas");
    setRegistrationId("");
    setMetaKey("");
    setMetaValue("");
    setError(null);
    setSuccess(null);
  };

  const closeDialog = () => {
    setOpen(false);
    setError(null);
    setSuccess(null);
  };

  const handleCreate = async () => {
    if (!deviceId.trim()) {
      setError("Device ID is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const meta =
        metaKey.trim() && metaValue.trim()
          ? { [metaKey.trim()]: metaValue.trim() }
          : undefined;

      // Pass registration_id_generated — falls back to deviceId if left empty
      await edgeConfigApi.createDevice(
        deviceId.trim(),
        authType,
        meta,
        registrationId.trim() || deviceId.trim() 
      );
      setSuccess(`Device "${deviceId}" created successfully.`);
      queryClient.invalidateQueries({ queryKey: ["get", "/devices", "withCountryData"] });
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? (e as Error).message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={openDialog}
        className="flex items-center gap-1 px-4 py-1.5 bg-blue-700 text-white rounded-md shadow-sm hover:bg-blue-600 hover:shadow-md active:scale-95 transition-all whitespace-nowrap"
      >
        Add Device
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={closeDialog} />
      )}

      {open && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-xl w-full max-w-md p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Create Device
          </h2>

          <div className="flex flex-col gap-3">
            {/* Device ID */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Device ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="e.g. 90909090"
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Auth Type
              </label>
              <select
                value={authType}
                onChange={(e) => setAuthType(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="sas">sas</option>
                <option value="tpm" disabled>tpm</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Registration ID{" "}
                <span className="text-gray-400 font-normal"></span>
              </label>
              <input
                type="text"
                value={registrationId}
                onChange={(e) => setRegistrationId(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Meta */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Meta{" "}
                <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={metaKey}
                  onChange={(e) => setMetaKey(e.target.value)}
                  placeholder="key"
                  className="w-1/2 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={metaValue}
                  onChange={(e) => setMetaValue(e.target.value)}
                  placeholder="value"
                  className="w-1/2 border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </p>
            )}

            {success && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
                {success}
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button
              onClick={closeDialog}
              className="text-sm px-4 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              {success ? "Close" : "Cancel"}
            </button>
            {!success && (
              <button
                onClick={handleCreate}
                disabled={loading}
                className="text-sm px-4 py-1.5 text-white rounded transition-colors disabled:opacity-50 bg-blue-900 hover:bg-blue-800"
              >
                {loading ? "Processing..." : "Create"}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}


interface DeleteDeviceDialogProps {
  deviceId: string;
  onClose: () => void;
}

export function DeleteDeviceDialog({ deviceId, onClose }: DeleteDeviceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await edgeConfigApi.deleteDevice(deviceId);
      setSuccess(`Device "${deviceId}" deleted successfully.`);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["get", "/devices", "withCountryData"] });
      }, 6000);
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? (e as Error).message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />

      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">
          Delete Device
        </h2>

        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Device ID
            </label>
            <input
              type="text"
              value={deviceId}
              disabled
              className="w-full border border-gray-200 rounded px-3 py-1.5 text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          {!success && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              This will permanently remove the device from SEMS, IoTHub, and the database.
            </p>
          )}

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </p>
          )}

          {/* Success */}
          {success && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
              {success}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="text-sm px-4 py-1.5 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
          >
            {success ? "Close" : "Cancel"}
          </button>
          {!success && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="text-sm px-4 py-1.5 text-white rounded transition-colors disabled:opacity-50 bg-red-700 bg-red-600"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}